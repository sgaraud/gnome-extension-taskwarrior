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
const Meta       = imports.gi.Meta;
const Shell      = imports.gi.Shell;
const ShellEntry = imports.ui.shellEntry;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Gio = imports.gi.Gio;
const Util = imports.misc.util;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const Prefs = Me.imports.prefs;
const Ui = Me.imports.ui;
const Taskwarrior = Me.imports.taskwarrior;

const OPEN_BROWSER = 'xdg-open';
let keybindingChangedId = null;
let Schema = null;

function init() {
    Schema = Convenience.getSettings();
}

const TaskMain = new Lang.Class({
    Name: 'Task.Main',
    Extends: PanelMenu.Button,

    _init: function () {

        this.parent(0.0, _("Taskwarrior Extension"));
        let nbox = new St.BoxLayout({style_class: 'panel-status-menu-box'});
        this.icon = new St.Icon({gicon: Taskwarrior.TASK_ICON, style_class: 'system-status-icon'});
        nbox.add_child(this.icon);
        this.actor.add_child(nbox);
        this.actor.show();

        // TODO what if not existing yet
        this._bindShortcuts();

        keybindingChangedId = Schema.connect('changed', Lang.bind(this, this._bindShortcuts));

        if (this._versionCheck()) {
            this.actorId = this.actor.connect('button-press-event', Lang.bind(this, this._update));
            this._update();
        }
    },

    _update: function (cmd) {
        log("_update");
        let taskList = Taskwarrior.taskwarriorCmds['export'](Taskwarrior.TASK_STATUS_PENDING);
        this._buildMainUi(taskList);
    },

    /*
     * Function checking that taskwarrior client is installed on system and at least version 2.0.0.
     * return: true if taskwarrior client is ok. false otherwise.
     */
    _versionCheck: function () {
        try {
            let [res, out, err, status] = GLib.spawn_command_line_sync(Taskwarrior.TASK_BIN + Taskwarrior.SP + Taskwarrior.TASK_VERSION);
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
        let item = new PopupMenu.PopupMenuItem(msg);
        this.menu.addMenuItem(item);
        this.goToWebsiteItemId = item.connect('activate', function () {
            Util.spawnCommandLine(OPEN_BROWSER + Taskwarrior.SP + Taskwarrior.TASK_WEBSITE);
        });
    },

    /*
     * Function displaying main UI.
     */
    _buildMainUi: function (list) {
        log("_buildMainUi");

        // Rebuild completely the menu with updated data
        this.menu.removeAll();

        // Display entry field for Adding Tasks
        this.menu.addMenuItem(new Ui.TaskwarriorShellEntry());
        //this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // If nothing to display
        if (typeof list === "undefined") {
            return;
        }

        // Lists the current tasks as in the taskList struct
        for (let task of list) {

            // Sub menu with buttons delete, modify
            // Show extra tasks infos project, urgency, date
            // TODO refactor in only one class type
            let itemSub1 = new Ui.TaskwarriorMenuAdvancedItem1(task);
            let itemSub2 = new Ui.TaskwarriorMenuAdvancedItem2(task);

            // Show task description + button when task is done + arrow to expand with extra options
            // TODO just give task instead of double params
            let item = new Ui.TaskwarriorMenuItem(task.description, task.uuid);

            item.menu.addMenuItem(itemSub1);
            item.menu.addMenuItem(itemSub2);
            this.menu.addMenuItem(item);
        }
    },

    /*
     * Keybindings to open or close the menu - key can be set in the extension pref menu
     */
    _bindShortcuts: function() {
        this.remove_keybindings();
        this.add_keybindings();
    },

    add_keybindings: function() {
        Main.wm.addKeybinding(
            Prefs.TOGGLE_MENU,
            Schema,
            Meta.KeyBindingFlags.NONE,
            Shell.ActionMode.NORMAL |
            Shell.ActionMode.MESSAGE_TRAY |
            Shell.ActionMode.OVERVIEW,
            Lang.bind(this, function() {
                this._toggleMenu();
            })
        );
    },

    remove_keybindings: function() {
        Main.wm.removeKeybinding(Prefs.TOGGLE_MENU);
    },

    _toggleMenu: function() {
        // TODO fix not closing
        log("_toogleMenu");
        if(this.menu.visible) {
            this.menu.close();
        }
        else {
            this.menu.open();
        }
    },

    /*
     * TODO complete
     */
    destroy: function () {
        this.parent();
    }
});

let _indicator;

function enable() {
    _indicator = new TaskMain;
    Main.panel.addToStatusArea('Taskwarrior-extension', _indicator);
}

function disable() {
    _indicator.destroy();
}
