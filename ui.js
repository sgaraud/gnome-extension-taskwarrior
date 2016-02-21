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

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const TaskwarriorMenuItem = new Lang.Class({
    Name: 'Taskwarrior.MenuItem',
    Extends: PopupMenu.PopupBaseMenuItem,

    _init: function(text, active, params) {
        this.parent(params);

        this.label = new St.Label({ text: text });
        this._button = new Button();

        /*this.actor.accessible_role = Atk.Role.CHECK_MENU_ITEM;
        this.checkAccessibleState();*/
        //this.actor.label_actor = this.label;

        this.actor.add_child(this.label);
        this._statusBin = new St.Bin({ x_align: St.Align.END });
        this.actor.add(this._statusBin, { expand: true, x_align: St.Align.END });
        this._statusBin.child = this._button.actor;

    },

    setStatus: function(text) {
    },

    activate: function(event) {
  /*      if (this._button.actor.mapped) {
            this.toggle();
        }
*/
        // we allow pressing space to toggle the switch
        // without closing the menu
        if (event.type() == Clutter.EventType.KEY_PRESS &&
            event.get_key_symbol() == Clutter.KEY_space)
            return;

        this.parent(event);
    }

});

const TaskwarriorShellEntry = new Lang.Class({
    Name: 'Taskwarrior.ShellEntry',
    Extends: PopupMenu.PopupBaseMenuItem,

    _init: function(params) {
        this.parent(params);

        this._entry = new St.Entry({ can_focus: true , x_expand: true , hint_text: _("Add task ...") });
        ShellEntry.addContextMenu(this._entry);
        this.actor.add_child(this._entry);

    },

    setStatus: function(text) {
    },

    activate: function(event) {
        /*      if (this._button.actor.mapped) {
         this.toggle();
         }
         */
        // TODO fix
        // we allow pressing space to toggle the switch
        // without closing the menu
        log(event.get_key_symbol());
        if (event.type() == Clutter.EventType.BUTTON_RELEASE ||
            event.get_key_symbol() == Clutter.KEY_space)
            return;

        this.parent(event);
    }

});

const TaskwarriorMenuAdvancedItem = new Lang.Class({
    Name: 'Taskwarrior.MenuAdvancedItem',
    Extends: PopupMenu.PopupBaseMenuItem,

    _init: function(params) {
        this.parent(params);

        this._button1 = new St.Button({ label: _("delete") });
        this._button2 = new St.Button({ label: _("modify") });
        this._button3 = new St.Button({ label: _("project") });

        /*this.actor.accessible_role = Atk.Role.CHECK_MENU_ITEM;
         this.checkAccessibleState();*/
        //this.actor.label_actor = this.label;

        this.actor.add_child(this._button1);
        this.actor.add_child(this._button2);
        this.actor.add_child(this._button3);

    },

    setStatus: function(text) {
    },

    activate: function(event) {
        /*      if (this._button.actor.mapped) {
         this.toggle();
         }
         */
        // we allow pressing space to toggle the switch
        // without closing the menu
        if (event.type() == Clutter.EventType.KEY_PRESS &&
            event.get_key_symbol() == Clutter.KEY_space)
            return;

        this.parent(event);
    }

});

const Button = new Lang.Class({
    Name: 'Button',

    _init: function(state) {
        let text = 'done';
        this.actor = new St.Button({ reactive: true,
            track_hover: true,
            label: text });

        this.actor.get_child().single_line_mode = true;
        this.actor.connect('clicked', Lang.bind(this, this._onClicked));
    },

    _onClicked: function() {
        log('bang');
    },

    toggle: function() {

    }
});