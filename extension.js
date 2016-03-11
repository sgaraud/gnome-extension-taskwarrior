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

const Lang      = imports.lang;
const St        = imports.gi.St;
const Meta      = imports.gi.Meta;
const Shell     = imports.gi.Shell;
const Main      = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Util      = imports.misc.util;

const ExtensionUtils    = imports.misc.extensionUtils;
const Me                = ExtensionUtils.getCurrentExtension();
const Convenience       = Me.imports.convenience;
const Prefs             = Me.imports.prefs;
const Ui                = Me.imports.ui;
const Taskwarrior       = Me.imports.taskwarrior;

const OPEN_BROWSER = 'xdg-open';
const INDICATOR_ICON = 'taskwarrior-icon';
let Schema = null;

function init() {
    Schema = Convenience.getSettings();
    let theme = imports.gi.Gtk.IconTheme.get_default();
    theme.append_search_path(Me.path + '/icons');
}

const TaskMain = new Lang.Class({
    Name: 'Task.Main',
    Extends: PanelMenu.Button,

    _init: function () {

        // Init gnome-shell extension icon in the taskbar
        this.parent(0.0, _("Taskwarrior Extension"));
        let nbox = new St.BoxLayout({style_class: 'panel-status-menu-box'});
        this.icon = new St.Icon({icon_name: INDICATOR_ICON, icon_size : 18, style_class: 'system-status-icon'});
        nbox.add_child(this.icon);
        this.actor.add_child(nbox);
        this.actor.show();

        // Bind menu opening to user defined keyboard shortcut
        this.add_keybindings();

        this.keybindingChangedId = Schema.connect('changed', Lang.bind(this, this._bindShortcuts));

        // Check taskwarrior is available on host and version is ok
        if (this._verifyTaskwarriorVersion(Taskwarrior.TASKWARRIOR_COMPAT)) {
            this.actorId = this.actor.connect('button-press-event', Lang.bind(this, this._mainUi));
            // Get task list and build ui menu
            this._mainUi();
        }
    },

    /*
     * Function displaying main ui
     */
    _mainUi: function () {
        this.update = new Ui.TaskwarriorListMenu(this.menu);
        this.update.refresh();
    },

    /*
     * Check the Taskwarrior version is at least matching defined compatibility version
     */
    _verifyTaskwarriorVersion: function(compat_version) {

        let tw_version = Taskwarrior._getVersion();

        if (!Array.isArray(tw_version)) {
            printerr(tw_version);
            this._goToWebsite("No Taskwarrior detected ! Click to Install");
            return false;
        }

        for (var i = 0; i < compat_version.length; ++i) {
            if (tw_version == i) {
                return true;
            }
            if (compat_version[i] > tw_version[i] ) {
                printerr(tw_version);
                this._goToWebsite("Taskwarrior outdated! Click to Install");
                return false;
            }
        }
        return true;
    },

    /*
     * Function redirecting to Taskwarrior website download section
     */
    _goToWebsite: function (msg) {
        this.goToWebsite = new PopupMenu.PopupMenuItem(msg);
        this.menu.addMenuItem(this.goToWebsite);
        this.goToWebsiteId = this.goToWebsite.connect('activate', function () {
            Util.spawnCommandLine(OPEN_BROWSER + Taskwarrior.SP + Taskwarrior.TASK_WEBSITE);
        });
    },

    /*
     * Keybindings to open or close the menu - key can be set in the extension pref menu
     */
    _bindShortcuts: function() {
        this.remove_keybindings();
        this.add_keybindings();
    },

    add_keybindings: function() {
        // compatibility gnome 3.16 / 3.18
        var ModeType = Shell.hasOwnProperty('ActionMode') ? Shell.ActionMode : Shell.KeyBindingMode;

        Main.wm.addKeybinding(Prefs.TOGGLE_MENU, Schema, Meta.KeyBindingFlags.NONE, ModeType.ALL,
            Lang.bind(this, this._toggleMenu));
    },

    remove_keybindings: function() {
        Main.wm.removeKeybinding(Prefs.TOGGLE_MENU);
    },

    _toggleMenu: function() {
        (this.menu.isOpen) ? this.menu.close() : this.menu.open();
    },

    /*
     * Disconnect signals and remove keybindings
     */
    destroy: function () {
        if (this.keybindingChangedId){
            Schema.disconnect(this.keybindingChangedId);
        }
        if (this.actorId) {
            this.actor.disconnect(this.actorId);
        }
        if (this.goToWebsiteId) {
            this.goToWebsite.disconnect(this.goToWebsiteId);
        }
        this.remove_keybindings();
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