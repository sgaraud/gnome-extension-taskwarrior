/*
 * Taskwarrior Integration with Gnome Shell
 * https://github.com/sgaraud/gnome-extension-taskwarrior
 *
 * Copyright (C) 2016 Sylvain Garaud
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 2 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
 * PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this
 * program. If not, see http://www.gnu.org/licenses/.
 *
 */

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Main = imports.ui.main;
const St = imports.gi.St;
const Params = imports.misc.params;
const Shell = imports.gi.Shell;
const ShellEntry = imports.ui.shellEntry;
const PopupMenu = imports.ui.popupMenu;
const PanelMenu = imports.ui.panelMenu;
const Atk = imports.gi.Atk;
const Clutter = imports.gi.Clutter;
const Tweener = imports.ui.tweener;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const SP = " ";
const TASK_ICON = Gio.icon_new_for_string(Me.path + "/icons/Taskwarrior_icon.png");
const TASK_WEBSITE = 'https://taskwarrior.org/download/';
const TASK_BIN = 'task';
const TASK_EXPORT = 'export';
const TASK_ADD = 'add';
const TASK_DONE = 'done';
const TASK_DELETE = 'delete';
const TASK_MODIFY = 'modify';
const TASK_START = 'start';
const TASK_STOP = 'stop';
const TASK_VERSION = '--version';
const TASK_STATUS_PENDING = 'status:pending';

const LABEL_EMPTY = "    ";
const LABEL_PROJECT = "project: ";
const LABEL_PRIORITY = "priority: ";
//const LABEL_URGENCY = "urgency: ";
const LABEL_ENTERED = "entered: ";
//const LABEL_MODIFIED = "modified: ";
const LABEL_DUE = "due: ";
const LABEL_TAGS = "tags: ";

/*
 * Dispatch table for possible cmd towards taskwarrior
 * TODO clean-up implementation
 */
var taskwarriorCmds = {
    delete: function (uuid) { return _deleteTask(uuid); },
    modify: function (uuid) { return _modifyTask(uuid, "test"); },
    done: function (uuid) { return _taskDone(uuid); },
    start: function (uuid) { return _startTask(uuid); },
    stop: function (uuid) { return _stopTask(uuid); },
    add: function (text) { return _addTask(text); },
    export: function (st) { return _exportTasks(st); },
    default: function () { log("unknown taskwarriorCmds"); }
};

const Task = new Lang.Class({
    Name: 'Task',
    _init: function (task) {
        this.uuid = task.uuid;
        this.id = task.id;
        this.description = task.description;
        this.entry = task.entry;
        this.modified = task.modified;
        this.due = task.due;
        this.urgency = task.urgency;
        this.priority = task.priority;
        this.project = task.project;
        this.tags = task.tags;
    }
});

/*
 * Function to export pending task list from Taskwarrior.
 */
function _exportTasks (st) {
    log("_exportTasks");
    let taskList = [];
    try {
        //[ok: Boolean, standard_output: ByteArray, standard_error: ByteArray, exit_status: Number(gint)]
        let [res, out, err, status] = GLib.spawn_command_line_sync(TASK_BIN + SP + TASK_EXPORT + SP + st);
        let lines = (new String(out)).split('\n');

        for (let i = 0; i < lines.length; i++) {
            // comma terminated in old taskwarrior versions
            lines[i] = lines[i].replace(/,\s*$/, '');
            if (lines[i].trim()) {
                let json = JSON.parse(lines[i]);
                let task = new Task(json);
                taskList[i] = task;
            }
        }
        return taskList;
    } catch (err) {
        log(err);
        return;
    }
}

/*
 * Function to compose a valid command line as a simple way to add task into Taskwarrior.
 */
function _addTask(text) {
    log("_addTask");
    // TODO handle character escape
    log(text);
    try {
        let [res, out, err, status] = GLib.spawn_command_line_sync(TASK_BIN + SP + TASK_ADD + SP + text);
        return res;
    } catch (err) {
        log(err);
        return;
    }
}

/*
 * Function to mark one task as completed.
 */
function _taskDone(uuid) {
    log("_taskDone");
    try {
        let [res, out, err, status] = GLib.spawn_command_line_sync(TASK_BIN + SP + uuid + SP + TASK_DONE);
        return res;
    } catch (err) {
        log(err);
        return;
    }
}

/*
 * Function to start a task.
 */
function _startTask(uuid) {
    log("_startTask");
    try {
        let [res, out, err, status] = GLib.spawn_command_line_sync(TASK_BIN + SP + TASK_START + SP + uuid);
        return res;
    } catch (err) {
        log(err);
        return;
    }
}

/*
 * Function to stop a task.
 */
function _stopTask(uuid) {
    log("_stopTask");
    try {
        let [res, out, err, status] = GLib.spawn_command_line_sync(TASK_BIN + SP + TASK_STOP + SP + uuid);
        return res;
    } catch (err) {
        log(err);
        return;
    }
}


/*
 * Function to modify a task.
 * TODO handle ACK
 */
function _modifyTask(uuid, cmd) {
    log("_modifyTask");
    try {
        let [res, out, err, status] = GLib.spawn_command_line_sync(TASK_BIN + SP + uuid + SP + TASK_MODIFY + SP + cmd);
        return res;
    } catch (err) {
        log(err);
        return;
    }
}

/*
 * Function to delete a task.
 * TODO handle ACK
 */
function _deleteTask(uuid) {
    log("_deleteTask");
    try {
        let [res, out, err, status] = GLib.spawn_command_line_sync(TASK_BIN + SP + uuid + SP + TASK_DELETE);
        return res;
    } catch (err) {
        log(err);
        return;
    }
}
