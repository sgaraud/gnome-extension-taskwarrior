#!/usr/bin/env bash
# Build Taskwarrior integration gnome shell extension

echo "Compile schema"
glib-compile-schemas ./schemas/

echo "Create zip archive"
rm taskwarrior-integration@sgaraud.github.com.zip
zip -r taskwarrior-integration@sgaraud.github.com.zip . -x \*.git* \*.idea*
echo "Done."
