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

const Clutter = imports.gi.Clutter;
const Lang = imports.lang;
const St = imports.gi.St;
const ShellEntry = imports.ui.shellEntry;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Gio = imports.gi.Gio;
const Util = imports.misc.util;
const GLib = imports.gi.GLib;

let TW_ICON = Gio.icon_new_for_string(Me.path + "/icons/Taskwarrior_icon.png");
let TW_SITE = 'https://taskwarrior.org/download/';
let TW_BIN = 'task';
let OPEN_BROWSER = 'xdg-open';

let EXPORT = ' export';
let VERSION = ' --version';
let PENDING = ' status:pending';
let DELETED = ' status:deleted';
let COMPLETED = ' status:completed';
let WAITING = ' status:waiting';
let RECURRING = ' status:recurring';

function init() {

}

const Task = new Lang.Class({
    Name: 'Task.Task',
    _init: function (task) {
        this.uuid = task.uuid;
        this.id = task.id;
        this.entry = task.entry;
        this.description = task.description;
        this.urgency = task.urgency;
    },
});

const TaskW = new Lang.Class({
    Name: 'TaskW.TaskW',
    Extends: PanelMenu.Button,

    _init: function () {

        this.parent(0.0, _("Taskwarrior Extension"));
        let nbox = new St.BoxLayout({style_class: 'panel-status-menu-box'});
        this.icon = new St.Icon({gicon: TW_ICON, style_class: 'system-status-icon'});
        nbox.add_child(this.icon);
        this.actor.add_child(nbox);
        this.actor.show();

        if (this._versionCheck()) {
            this.actorId = this.actor.connect('button-press-event', Lang.bind(this, this._update));
            this._update();
        }
    },

    _update: function (cmd) {
        this.menu.removeAll();
        this._export(PENDING);
        this._buildMainUI();
    },

    /*
     * Function to query data from Taskwarrior and create local task array
     */
    _export: function (st) {

        this.taskList = [];

        try {
            //[ok: Boolean, standard_output: ByteArray, standard_error: ByteArray, exit_status: Number(gint)]
            let [res, out, err, status] = GLib.spawn_command_line_sync(TW_BIN + EXPORT + st);
            var lines = (new String(out)).split('\n');
            for(var i = 0;i < lines.length;i++){
                let json = JSON.parse(lines[i]);
                let task = new Task(json);
                this.taskList[i] = task;
            }
        } catch (err) {
            log(err);
        }

    },

    /*
     * Function to compose a valid command line as a simple way to put data into Taskwarrior.
     */
    _import: function (cmd) {

    },

    /*
     * TODO
     */
    _addTask: function (cmd) {

    },

    /*
     * TODO
     */
    _taskDone: function (cmd) {

    },

    /*
     * TODO
     */
    _modifyTask: function (cmd) {

    },

    /*
     * Function checking that taskwarrior client is installed on system and at least version 2.0.0.
     * return: true if taskwarrior client is ok. false otherwise.
     */
    _versionCheck: function () {

        try {
            let [res, out, err, status] = GLib.spawn_command_line_sync(TW_BIN + VERSION);
            let version = new String(out);
            let major = version.split('.')[0];
            if ( typeof major != 'string' || isNaN(major) || parseInt(major) < 2) {
                log(version);
                this._goToWebsite("Taskwarrior version outdated ! Click to Update");
            }
            return true;
        } catch (err) {
            log(err);
            this._goToWebsite("No Taskwarrior detected ! Click to Install");
            return false;
        }
    },

    /*
     * Function redirecting to Taskwarrior website download section
     */
    _goToWebsite: function (msg) {
        this.item = new PopupMenu.PopupMenuItem(msg);
        this.menu.addMenuItem(this.item);
        this.itemId = this.item.connect('activate', function () {
            Util.spawnCommandLine(OPEN_BROWSER + " " + TW_SITE);
        });
    },

    /*
     * Function displaying main UI with all task entries.
     * TODO
     */
    _buildMainUI: function () {


        this._entry = new St.Entry({ can_focus: true });
        ShellEntry.addContextMenu(this._entry);


        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        for (let task of this.taskList) {
            this.menu.addMenuItem(new PopupMenu.PopupMenuItem(task.description.toString()));
        }


    },

    /*
     * Function used as template for a single task UI, managing actions buttons
     * TODO
     */
    _buildTaskUI: function () {

    },

    /*
     * TODO
     */
    destroy: function () {
        this.parent();
    },
});

let _indicator;

function enable() {
    _indicator = new TaskW;
    Main.panel.addToStatusArea('Taskwarrior-extension', _indicator);
}

function disable() {
    _indicator.destroy();
}
