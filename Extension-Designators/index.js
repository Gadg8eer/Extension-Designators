/**
 * Designators — registers named cast macros such as {{p10}} and {{char_cp2077_1}}.
 * Edit the roster in Extensions settings. Values are looked up live, so a rename applies
 * on the next substitution without a reload.
 */
const MODULE_NAME = 'designators';

/** @typedef {{ key: string, value: string, note: string }} Designator */

/** @type {readonly Designator[]} */
const DEFAULT_ROSTER = Object.freeze([
    { key: 'p10', value: 'Gadg8eer', note: 'GM Persona' },
    { key: 'p86', value: 'ArcoIris', note: 'Persona' },
    { key: 'char_mmbn_winterexe', value: 'WinterMan.EXE', note: 'GM's NetNavi' },
    { key: 'char_cp2077_1', value: 'Yucca', note: 'Cyberpunk 2077 mechanic' },
]);

/** Same identifier rules as SillyTavern macros / variable shorthands. */
const MACRO_NAME_RE = /^[A-Za-z](?:[A-Za-z0-9_-]*[A-Za-z0-9])?$/;

const registered = new Set();
let initialized = false;

function getContext() {
    return SillyTavern.getContext();
}

function getSettings() {
    const { extensionSettings } = getContext();
    if (!extensionSettings[MODULE_NAME]) {
        extensionSettings[MODULE_NAME] = { roster: structuredClone(DEFAULT_ROSTER) };
    }
    if (!Array.isArray(extensionSettings[MODULE_NAME].roster)) {
        extensionSettings[MODULE_NAME].roster = structuredClone(DEFAULT_ROSTER);
    }
    return extensionSettings[MODULE_NAME];
}

function saveSettings() {
    getContext().saveSettingsDebounced();
}

function isValidKey(key) {
    return typeof key === 'string' && MACRO_NAME_RE.test(key.trim());
}

function lookup(key) {
    const row = getSettings().roster.find((item) => item.key === key);
    return row?.value ?? '';
}

function unregisterAll() {
    const ctx = getContext();
    const unregister = ctx.macros?.registry?.unregisterMacro?.bind(ctx.macros.registry)
        ?? ctx.unregisterMacro?.bind(ctx);
    if (!unregister) {
        registered.clear();
        return;
    }
    for (const key of registered) {
        try {
            unregister(key);
        } catch (error) {
            console.warn(`[${MODULE_NAME}] could not unregister {{${key}}}`, error);
        }
    }
    registered.clear();
}

function registerAll() {
    const ctx = getContext();
    unregisterAll();

    const seen = new Set();
    for (const row of getSettings().roster) {
        const key = String(row.key ?? '').trim();
        if (!isValidKey(key) || seen.has(key.toLowerCase())) {
            continue;
        }
        seen.add(key.toLowerCase());

        const description = row.note
            ? `Designator: ${row.note}`
            : `Designator ${key}`;

        try {
            if (ctx.macros?.register) {
                const spec = {
                    description,
                    handler: () => String(lookup(key) ?? ''),
                };
                if (ctx.macros.category?.UTILITY) {
                    spec.category = ctx.macros.category.UTILITY;
                }
                ctx.macros.register(key, spec);
            } else if (ctx.registerMacro) {
                ctx.registerMacro(key, () => String(lookup(key) ?? ''));
            } else {
                console.error(`[${MODULE_NAME}] no macro API available`);
                return;
            }
            registered.add(key);
        } catch (error) {
            console.warn(`[${MODULE_NAME}] could not register {{${key}}}`, error);
        }
    }

    console.debug(`[${MODULE_NAME}] registered`, [...registered]);
}

function mountSettings() {
    if (document.getElementById('desig_drawer')) {
        renderRoster();
        return;
    }

    const $root = $('#extensions_settings2');
    if (!$root.length) {
        return;
    }

    $root.append(`
        <div id="desig_drawer" class="designators-settings">
            <div class="inline-drawer">
                <div class="inline-drawer-toggle inline-drawer-header">
                    <b>Designators</b>
                    <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                </div>
                <div class="inline-drawer-content">
                    <small>
                        Registers <code>{{key}}</code> macros for the roster below.
                        Names must start with a letter and use only letters, digits, underscores, or hyphens.
                    </small>
                    <div id="desig_rows" style="display:flex;flex-direction:column;gap:8px;margin:8px 0;"></div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                        <div id="desig_add" class="menu_button menu_button_icon">
                            <i class="fa-solid fa-plus"></i>
                            <span>Add designator</span>
                        </div>
                        <div id="desig_reset" class="menu_button menu_button_icon">
                            <i class="fa-solid fa-rotate-left"></i>
                            <span>Reset defaults</span>
                        </div>
                    </div>
                    <small id="desig_status"></small>
                </div>
            </div>
        </div>
    `);

    $('#desig_add').on('click', () => {
        getSettings().roster.push({ key: '', value: '', note: '' });
        saveSettings();
        renderRoster();
    });

    $('#desig_reset').on('click', () => {
        getSettings().roster = structuredClone(DEFAULT_ROSTER);
        saveSettings();
        registerAll();
        renderRoster();
    });

    renderRoster();
}

function setStatus(message, isError = false) {
    const $status = $('#desig_status');
    $status.text(message || '');
    $status.css('color', isError ? 'var(--SmartThemeQuoteColor, #c44)' : '');
}

function renderRoster() {
    const $list = $('#desig_rows');
    if (!$list.length) {
        return;
    }
    $list.empty();

    const roster = getSettings().roster;
    const errors = [];

    roster.forEach((row, index) => {
        const key = String(row.key ?? '').trim();
        if (key && !isValidKey(key)) {
            errors.push(`"${key}" is not a valid macro name`);
        }

        const $row = $(`
            <div class="desig-row" data-index="${index}" style="display:grid;grid-template-columns:minmax(7em,1fr) minmax(8em,1.4fr) minmax(7em,1fr) auto;gap:6px;align-items:center;">
                <input class="text_pole desig-key" type="text" placeholder="p10" spellcheck="false" />
                <input class="text_pole desig-value" type="text" placeholder="Display name" />
                <input class="text_pole desig-note" type="text" placeholder="Note" />
                <div class="menu_button menu_button_icon desig-del" title="Remove">
                    <i class="fa-solid fa-trash"></i>
                </div>
            </div>
        `);
        $row.find('.desig-key').val(row.key ?? '');
        $row.find('.desig-value').val(row.value ?? '');
        $row.find('.desig-note').val(row.note ?? '');
        $list.append($row);
    });

    $list.find('.desig-key, .desig-value, .desig-note').on('input', function () {
        const $row = $(this).closest('.desig-row');
        const index = Number($row.data('index'));
        const target = getSettings().roster[index];
        if (!target) {
            return;
        }
        target.key = String($row.find('.desig-key').val() ?? '').trim();
        target.value = String($row.find('.desig-value').val() ?? '');
        target.note = String($row.find('.desig-note').val() ?? '');
        saveSettings();
        registerAll();
        const bad = getSettings().roster
            .map((item) => String(item.key ?? '').trim())
            .filter((item) => item && !isValidKey(item));
        setStatus(
            bad.length ? `Invalid name(s): ${bad.join(', ')}` : `Active: ${[...registered].map((key) => `{{${key}}}`).join(', ') || '(none)'}`,
            bad.length > 0,
        );
    });

    $list.find('.desig-del').on('click', function () {
        const index = Number($(this).closest('.desig-row').data('index'));
        getSettings().roster.splice(index, 1);
        saveSettings();
        registerAll();
        renderRoster();
    });

    setStatus(
        errors.length
            ? errors.join(' · ')
            : `Active: ${[...registered].map((key) => `{{${key}}}`).join(', ') || '(none)'}`,
        errors.length > 0,
    );
}

function init() {
    getSettings();
    registerAll();
    mountSettings();
    initialized = true;
}

export function onActivate() {
    init();
}

export function onEnable() {
    registerAll();
}

export function onDisable() {
    unregisterAll();
}

jQuery(() => {
    if (!initialized) {
        init();
    } else {
        mountSettings();
    }
});
