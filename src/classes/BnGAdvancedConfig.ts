import { log, LogLevel } from '../module/logging';
import { MODULE_ID } from '../constants';
import { BloodNGuts } from '../blood-n-guts';
import { getHexColor } from '../module/helpers';
import ViolenceConfig from './ViolenceConfig';

/**
 * FormApplication window for advanced configuration options.
 * @class
 * @extends FormApplication
 */
export class BnGAdvancedConfig extends FormApplication {
  font: SplatFont;
  allAsciiCharacters: string;
  dataObject: Record<string, unknown>;

  constructor(object: Record<string, unknown>, options?: FormApplicationOptions) {
    super(object, options);
    game.settings.sheet.close();
    game.users.apps.push(this);
    this.dataObject = {};
  }

  static get defaultOptions(): FormApplicationOptions {
    const options = super.defaultOptions;
    options.title = 'Configure Blood n Guts Advanced Settings';
    options.id = MODULE_ID;
    options.template = 'modules/blood-n-guts/templates/advanced-config.html';
    options.closeOnSubmit = true;
    options.popOut = true;
    options.width = 600;
    options.height = 'auto';
    return options;
  }

  /**
   * Obtain settings data and return to the FormApplication
   * @category Foundry
   * @function
   * @async
   * @returns {Promise<Record<string, unknown>>} - The data provided to the template when rendering the form
   * @override
   * @see {FormApplication#getData}
   */
  async getData(): Promise<Record<string, unknown>> {
    this.dataObject['fonts'] = BloodNGuts.allFonts;
    this.dataObject['floorSplatFont'] = game.settings.get(MODULE_ID, 'floorSplatFont');
    this.dataObject['tokenSplatFont'] = game.settings.get(MODULE_ID, 'tokenSplatFont');
    this.dataObject['trailSplatFont'] = game.settings.get(MODULE_ID, 'trailSplatFont');
    this.dataObject['currentLevel'] = game.settings.get(MODULE_ID, 'currentViolenceLevel');

    const violenceLevelChoices = {};
    for (const level in game.settings.get(MODULE_ID, 'violenceLevels')) {
      violenceLevelChoices[level] = level;
    }
    this.dataObject['levels'] = violenceLevelChoices;
    return this.dataObject;
  }

  /**
   * Calls `super.render()` - not entirely sure why it's needed.
   * @category Foundry
   * @function
   * @param {boolean} force
   * @param context
   * @returns {Application}
   * @override
   * @see {FormApplication#render}
   */
  public render(force?: boolean, context = {}): Application {
    return super.render(force, context);
  }

  /**
   * Activate listeners on the form.
   * @category Foundry
   * @function
   * @param {JQuery} html - the form html
   * @override
   * @see {FormApplication#activateListeners}
   */
  activateListeners(html: JQuery): void {
    super.activateListeners(html);
    const wipeButton = html.find('.advanced-config-wipe-scene-splats');
    if (canvas.scene.active) {
      wipeButton.click(() => {
        log(LogLevel.DEBUG, 'wipeButton: BloodNGuts.wipeAllFlags()');
        BloodNGuts.wipeAllFlags();
        // this will wipe any DOM splats created by splatButton
        $('.splat-container').remove();
      });
    } else wipeButton.attr('disabled', 'true');

    const splatButton = html.find('.advanced-config-splat-window');
    const appWindow = html.closest('.app.window-app.form#blood-n-guts');
    splatButton.click(() => {
      log(LogLevel.DEBUG, 'splatButton: BloodNGuts.drawDOMSplats()');
      BloodNGuts.drawDOMSplats(
        appWindow[0],
        BloodNGuts.allFonts[game.settings.get(MODULE_ID, 'tokenSplatFont')],
        250,
        4,
        getHexColor('blood'),
      );
    });

    const editButton = html.find('button#editButton');
    const newButton = html.find('button#newButton');

    editButton.on('click', () => {
      new ViolenceConfig().render(true);
    });
    newButton.on('click', () => {
      new ViolenceConfig('New').render(true);
    });

    const violenceSelect = html.find('select#currentLevel');

    violenceSelect.on('change', (event: JQuery.ChangeEvent) => {
      game.settings.set(MODULE_ID, 'currentViolenceLevel', event.target.value);
    });
  }

  /**
   * This method is called upon form submission after form data is validated.
   * @category Foundry
   * @function
   * @async
   * @param {Event} _event - The initial triggering submission event
   * @param {Record<string, unknown>} formData - The object of validated form data with which to update the object
   * @override
   * @see {FormApplication#_updateObject}
   */
  async _updateObject(_event: Event, formData: Record<string, unknown>): Promise<void> {
    delete formData.currentLevel;
    for (const setting in formData) {
      game.settings.set(MODULE_ID, setting, formData[setting]);
    }
    if (!canvas.scene.active)
      ui.notifications.notify(`Note: Blood 'n Guts does not work on non-active scenes!`, 'warning');
  }
}
