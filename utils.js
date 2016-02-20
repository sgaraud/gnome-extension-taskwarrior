const Gettext = imports.gettext;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Clutter = imports.gi.Clutter;
const ExtensionUtils = imports.misc.extensionUtils;

const Config = imports.misc.config;
const Me = ExtensionUtils.getCurrentExtension();

const ICONS = {
    ZOOM_IN: 'zoom-in-symbolic',
    CAMERA: 'camera-photo-symbolic'
};

const SETTINGS = getSettings();

function launch_viewer(url, callback) {
    let app_file = '%s/%s'.format(Me.path, 'viewer.js');

    let [success, pid] = GLib.spawn_async(
        null,
        ['gjs', app_file, url],
        null,
        GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.DO_NOT_REAP_CHILD,
        null
    );

    if(!success) {
        callback(false);
        return;
    }

    GLib.child_watch_add(GLib.PRIORITY_DEFAULT, pid,
        function(pid, status) {
            GLib.spawn_close_pid(pid);

            if(status != 0) {
                callback(false);
            }
            else {
                callback(true);
            }
        }
    );
}


function wikipedia_normalize_title(title) {
    title = title.replace(/_+/g, ' ');
    title = title.replace(/ +/g, ' ');
    title = title.charAt(0).toUpperCase() + title.slice(1);
    title = title.trim();
    return title;
}

function is_pointer_inside_actor(actor, x, y) {
    let result = false;
    let [actor_x, actor_y] = actor.get_transformed_position();
    let [pointer_x, pointer_y] = global.get_pointer();

    if(x) pointer_x = x;
    if(y) pointer_y = y;

    if(
        pointer_x >= actor_x
        && pointer_x <= (actor_x + actor.width)
        && pointer_y >= actor_y
        && pointer_y <= (actor_y + actor.height)
    ) {
        result = true;
    }

    return result;
}

function is_empty_entry(entry) {
    if(is_blank(entry.text) || entry.text === entry.hint_text) {
        return true
    }
    else {
        return false;
    }
}

function get_unichar(keyval) {
    let ch = Clutter.keysym_to_unicode(keyval);

    if(ch) {
        return String.fromCharCode(ch);
    }
    else {
        return false;
    }
}

function is_blank(str) {
    return (!str || /^\s*$/.test(str));
}

function starts_with(str1, str2) {
    return str1.slice(0, str2.length) == str2;
}

function ends_with(str1, str2) {
  return str1.slice(-str2.length) == str2;
}

function escape_html(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

/**
 * initTranslations:
 * @domain: (optional): the gettext domain to use
 *
 * Initialize Gettext to load translations from extensionsdir/locale.
 * If @domain is not provided, it will be taken from metadata['gettext-domain']
 */
function initTranslations(domain) {
    let extension = ExtensionUtils.getCurrentExtension();

    domain = domain || extension.metadata['gettext-domain'];

    // check if this extension was built with "make zip-file", and thus
    // has the locale files in a subfolder
    // otherwise assume that extension has been installed in the
    // same prefix as gnome-shell
    let localeDir = extension.dir.get_child('locale');
    if (localeDir.query_exists(null))
        Gettext.bindtextdomain(domain, localeDir.get_path());
    else
        Gettext.bindtextdomain(domain, Config.LOCALEDIR);
}

/**
 * getSettings:
 * @schema: (optional): the GSettings schema id
 *
 * Builds and return a GSettings schema for @schema, using schema files
 * in extensionsdir/schemas. If @schema is not provided, it is taken from
 * metadata['settings-schema'].
 */
function getSettings(schema) {
    let extension = ExtensionUtils.getCurrentExtension();

    schema = schema || extension.metadata['settings-schema'];

    const GioSSS = Gio.SettingsSchemaSource;

    // check if this extension was built with "make zip-file", and thus
    // has the schema files in a subfolder
    // otherwise assume that extension has been installed in the
    // same prefix as gnome-shell (and therefore schemas are available
    // in the standard folders)
    let schemaDir = extension.dir.get_child('schemas');
    let schemaSource;
    if (schemaDir.query_exists(null))
        schemaSource = GioSSS.new_from_directory(schemaDir.get_path(),
                                                 GioSSS.get_default(),
                                                 false);
    else
        schemaSource = GioSSS.get_default();

    let schemaObj = schemaSource.lookup(schema, true);
    if (!schemaObj)
        throw new Error(
            'Schema ' + schema + ' could not be found for extension ' +
             extension.metadata.uuid + '. Please check your installation.'
        );

    return new Gio.Settings({ settings_schema: schemaObj });
}
