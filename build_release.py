#!/usr/bin/env python3
"""
MSTeamsKeeper - Release Packager
Creates a clean, store-ready ZIP archive for Firefox Add-ons (AMO),
Chrome Web Store, and Microsoft Edge Add-ons.
"""

import os
import sys
import json
import zipfile
from pathlib import Path

BASE_DIR = Path(__file__).parent.resolve()
EXT_DIR = BASE_DIR / "teams-extension"
RELEASE_DIR = BASE_DIR / "release"
MANIFEST_PATH = EXT_DIR / "manifest.json"

IGNORED_FILENAMES = {".DS_Store", "Thumbs.db"}
IGNORED_EXTENSIONS = {".swp", ".tmp", ".bak"}


def validate_manifest(manifest_data):
    required_keys = ["manifest_version", "name", "version"]
    for key in required_keys:
        if key not in manifest_data:
            print(f"❌ Error: Missing required key in manifest.json: {key}")
            sys.exit(1)

    # Check Firefox gecko settings
    gecko = manifest_data.get("browser_specific_settings", {}).get("gecko", {})
    if not gecko.get("id"):
        print("⚠️  Warning: Missing 'browser_specific_settings.gecko.id' (required by Firefox AMO for MV3)")
    else:
        print(f"  ✓ Gecko Extension ID: {gecko['id']}")

    if not gecko.get("data_collection_permissions"):
        print("⚠️  Warning: Missing 'browser_specific_settings.gecko.data_collection_permissions' (required by Firefox AMO)")
    else:
        print(f"  ✓ Data Collection Permissions: {gecko['data_collection_permissions']}")


def build():
    if not EXT_DIR.exists():
        print(f"❌ Error: Extension directory not found: {EXT_DIR}")
        sys.exit(1)

    if not MANIFEST_PATH.exists():
        print(f"❌ Error: manifest.json not found: {MANIFEST_PATH}")
        sys.exit(1)

    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    name = manifest.get("name", "MSTeamsKeeper").lower().replace(" ", "-")
    version = manifest.get("version", "1.0.0")

    print(f"📦 Packaging {manifest.get('name')} v{version}...")
    validate_manifest(manifest)

    RELEASE_DIR.mkdir(parents=True, exist_ok=True)
    zip_filename = f"{name}-v{version}.zip"
    zip_filepath = RELEASE_DIR / zip_filename

    packaged_files = []

    with zipfile.ZipFile(zip_filepath, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(EXT_DIR):
            for file in files:
                if file in IGNORED_FILENAMES or file.startswith("."):
                    continue
                if any(file.endswith(ext) for ext in IGNORED_EXTENSIONS):
                    continue

                full_path = Path(root) / file
                rel_path = full_path.relative_to(EXT_DIR)

                zipf.write(full_path, arcname=str(rel_path))
                packaged_files.append((str(rel_path), full_path.stat().st_size))

    print(f"\n📂 Included files in archive:")
    for rel_path, size in sorted(packaged_files):
        print(f"  • {rel_path} ({size:,} bytes)")

    zip_size_kb = zip_filepath.stat().st_size / 1024
    print(f"\n✅ Build complete: {zip_filepath.relative_to(BASE_DIR)} ({zip_size_kb:.1f} KB)")
    print("\nReady to submit:")
    print("  🦊 Firefox Add-ons (AMO): https://addons.mozilla.org/developers/")
    print("  🌐 Chrome Web Store:     https://chrome.google.com/webstore/devconsole")
    print("  🌊 Edge Add-ons:         https://partner.microsoft.com/dashboard/microsoftedge\n")


if __name__ == "__main__":
    build()
