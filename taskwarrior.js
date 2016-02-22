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
const Shell      = imports.gi.Shell;
const ShellEntry = imports.ui.shellEntry;
const PopupMenu = imports.ui.popupMenu;
const PanelMenu = imports.ui.panelMenu;
const Atk = imports.gi.Atk;
const Clutter = imports.gi.Clutter;
const Tweener = imports.ui.tweener;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const TASK_ICON = Gio.icon_new_for_string(Me.path + "/icons/Taskwarrior_icon.png");
const TASK_WEBSITE = 'https://taskwarrior.org/download/';
const TASK_BIN = 'task';
const OPEN_BROWSER = 'xdg-open';
const TASK_EXPORT = ' export';
const TASK_VERSION = ' --version';
const TASK_STATUS_PENDING = ' status:pending';

const LABEL_DELETE = 'delete';
const LABEL_MODIFY = 'modify';
const LABEL_DONE = 'done';
const LABEL_START = 'start';
const LABEL_STOP = 'stop';

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
 */
var taskwarriorCmds = {
    delete     : function() { log("yahoo1"); },
    modify     : function() { log("yahoo2"); },
    done       : function() { log("yahoo3"); },
    start      : function() { log("yahoo4"); },
    stop       : function() { log("yahoo5"); },
    add        : function(text) { log(text); },
    default    : function() { log("yahoo6"); }
};


