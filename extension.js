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
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Gio = imports.gi.Gio;
const Util = imports.misc.util;
const GLib = imports.gi.GLib;

let TW_ICON = Gio.icon_new_for_string(Me.path + "/icons/Taskwarrior_icon.png");
let TW_SITE = 'https://taskwarrior.org/download/'
let TW_BIN = 'task'
let OPEN_BROWSER = 'xdg-open'

function init() {

}

const Task = new Lang.Class({
    Name: 'Task.Task',
    _init: function (obj) {
        this.task = obj;
    },
});

const TaskList = new Lang.Class({
    Name: 'TaskList.TaskList',
    Extends: PanelMenu.Button,

    _init: function () {

        this.parent(0.0, _("Task List"));
        let nbox = new St.BoxLayout({style_class: 'panel-status-menu-box'});
        this.icon = new St.Icon({gicon: TW_ICON, style_class: 'system-status-icon'});

        nbox.add_child(this.icon);
        this.actor.add_child(nbox);
        this.actor.show();
        this._versionCheck();
    },

    _command: function (cmd) {

        try {
            //[ok: Boolean, standard_output: ByteArray, standard_error: ByteArray, exit_status: Number(gint)]
            let [res, out, err, status] = GLib.spawn_command_line_sync(cmd);
            return out;
            //Util.trySpawnCommandLine();
        } catch (err) {
            this.item = new PopupMenu.PopupMenuItem("No Taskwarrior detected ! Click to Install");
            this.menu.addMenuItem(this.item);
            this.itemId = this.item.connect('activate', function () {
                Util.spawnCommandLine(OPEN_BROWSER + " " + TW_SITE);
            });
            return err;
        }

    },

    /*
     * Function checking that taskwarrior client is installed on system and at least version 2.0.0.
     */
    _versionCheck: function () {

        try {
            //[ok: Boolean, standard_output: ByteArray, standard_error: ByteArray, exit_status: Number(gint)]
            let [res, out, err, status] = GLib.spawn_command_line_sync(TW_BIN + " --version");
            let version = new String(out);
            let major = version.split('.')[0];
            if ( typeof major != 'string' || parseInt(major) < 2) {
                log(version);
                this.item = new PopupMenu.PopupMenuItem("Taskwarrior version outdated ! Click to Update");
                this.menu.addMenuItem(this.item);
                this.itemId = this.item.connect('activate', function () {
                    Util.spawnCommandLine(OPEN_BROWSER + " " + TW_SITE);
                });
            }
        } catch (err) {
            log(err);
            this.item = new PopupMenu.PopupMenuItem("No Taskwarrior detected ! Click to Install");
            this.menu.addMenuItem(this.item);
            this.itemId = this.item.connect('activate', function () {
                Util.spawnCommandLine(OPEN_BROWSER + " " + TW_SITE);
            });
        }

    },

    destroy: function () {
        this.parent();
    },
});

let _indicator;

function enable() {
    _indicator = new TaskList;
    Main.panel.addToStatusArea('Taskwarrior-list', _indicator);
}

function disable() {
    _indicator.destroy();
}
