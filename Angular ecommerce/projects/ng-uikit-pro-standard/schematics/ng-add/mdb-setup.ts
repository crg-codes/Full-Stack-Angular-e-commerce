import {
  Rule,
  SchematicContext,
  Tree,
  chain,
  SchematicsException,
} from '@angular-devkit/schematics';
import { strings } from '@angular-devkit/core';
import { getWorkspace } from '@schematics/angular/utility/config';
import { addProviderToModule } from '@schematics/angular/utility/ast-utils';
import { InsertChange } from '@schematics/angular/utility/change';
import {
  getAppModulePath,
  getProjectMainFile,
  hasNgModuleImport,
  addModuleImportToRootModule,
  getProjectFromWorkspace,
  getProjectIndexFiles,
  appendHtmlElementToHead,
  getProjectStyleFile,
} from '@angular/cdk/schematics';
import { Schema } from './schema';
import * as ts from 'typescript';

export default function(options: Schema): Rule {
  return chain([
    addMdbProModuleImport(options),
    addMdbSpinngPreloaderProvider(options),
    addAngularAnimationsModule(options),
    addStylesAndScriptsToAngularJson(options),
    addRobotoFontToIndexHtml(),
    addAdditionalStylesImports(options),
  ]);
}

function addMdbProModuleImport(options: Schema) {
  return (tree: Tree) => {
    const workspace = getWorkspace(tree);
    const project = getProjectFromWorkspace(workspace, options.project);
    const mdbProModuleName = 'MDBBootstrapModulesPro.forRoot()';
    const mdbProModulePath = 'ng-uikit-pro-standard';

    addModuleImportToRootModule(tree, mdbProModuleName, mdbProModulePath, project);

    return tree;
  };
}

function addMdbSpinngPreloaderProvider(options: Schema) {
  return (tree: Tree) => {
    const workspace = getWorkspace(tree);
    const project = getProjectFromWorkspace(workspace, options.project);
    const appModulePath = getAppModulePath(tree, getProjectMainFile(project));
    const text = tree.read(appModulePath);

    if (!text) {
      throw new SchematicsException(`File ${appModulePath} does not exist.`);
    }

    const sourceText = text.toString('utf-8');
    const source = ts.createSourceFile(appModulePath, sourceText, ts.ScriptTarget.Latest, true);
    const providerPath = 'ng-uikit-pro-standard';
    const classifiedName = strings.classify('MDBSpinningPreloader');

    const providersChanges = addProviderToModule(
      source,
      appModulePath,
      classifiedName,
      providerPath
    );

    const providersRecorder = tree.beginUpdate(appModulePath);
    for (const change of providersChanges) {
      if (change instanceof InsertChange) {
        providersRecorder.insertLeft(change.pos, change.toAdd);
      }
    }
    tree.commitUpdate(providersRecorder);

    return tree;
  };
}

function addAngularAnimationsModule(options: Schema) {
  return (tree: Tree, context: SchematicContext) => {
    const workspace = getWorkspace(tree);
    const project = getProjectFromWorkspace(workspace, options.project);
    const appModulePath = getAppModulePath(tree, getProjectMainFile(project));
    const browserAnimationModule = 'BrowserAnimationsModule';
    const animationsModulePath = '@angular/platform-browser/animations';
    const noopAnimationModule = 'NoopAnimationsModule';

    if (options.animations) {
      if (hasNgModuleImport(tree, appModulePath, noopAnimationModule)) {
        context.logger.error(
          `Could not add ${browserAnimationModule} because ${noopAnimationModule} is already added`
        );
        return;
      }

      addModuleImportToRootModule(tree, browserAnimationModule, animationsModulePath, project);
    } else if (!hasNgModuleImport(tree, appModulePath, noopAnimationModule)) {
      addModuleImportToRootModule(tree, noopAnimationModule, animationsModulePath, project);
    }

    return tree;
  };
}

function addRobotoFontToIndexHtml() {
  return (tree: Tree, context: SchematicContext) => {
    const fontUrl = 'https://fonts.googleapis.com/css?family=Roboto:300,400,500,600&display=swap';
    const workspace = getWorkspace(tree);
    const project = getProjectFromWorkspace(workspace);
    const projectIndexFiles = getProjectIndexFiles(project);
    const logger = context.logger;

    if (!projectIndexFiles.length) {
      logger.error('Index HTML not found');
      logger.info('Add roboto font manually');
      return;
    }

    projectIndexFiles.forEach((indexFile: any) => {
      appendHtmlElementToHead(tree, indexFile, `<link href="${fontUrl}" rel="stylesheet">`);
    });

    return tree;
  };
}

function addStylesAndScriptsToAngularJson(options: Schema) {
  return (tree: Tree, context: SchematicContext) => {
    const logger = context.logger;
    const mainStyles = [
      {
        name: 'bootstrap',
        path: './node_modules/ng-uikit-pro-standard/assets/scss/bootstrap/bootstrap.scss',
      },
      { name: 'mdb', path: './node_modules/ng-uikit-pro-standard/assets/scss/mdb.scss' },
    ];

    const additionalStyles = [
      {
        name: 'fontawesome',
        path: './node_modules/@fortawesome/fontawesome-free/scss/fontawesome.scss',
      },
      {
        name: 'fontawesome-solid',
        path: './node_modules/@fortawesome/fontawesome-free/scss/solid.scss',
      },
      {
        name: 'fontawesome-regular',
        path: './node_modules/@fortawesome/fontawesome-free/scss/regular.scss',
      },
      {
        name: 'fontawesome-brand',
        path: './node_modules/@fortawesome/fontawesome-free/scss/brands.scss',
      },
      { name: 'animate.css', path: './node_modules/animate.css/animate.css' },
    ];

    const allStyles = options.externalDependencies
      ? [...mainStyles, ...additionalStyles]
      : mainStyles;
    const additionalScripts = [
      { name: 'chart.js', path: './node_modules/chart.js/dist/Chart.js' },
      { name: 'hammerjs', path: './node_modules/hammerjs/hammer.min.js' },
    ];

    const angularJsonFile = tree.read('angular.json');

    if (angularJsonFile) {
      const angularJsonFileObject = JSON.parse(angularJsonFile.toString('utf-8'));
      const project = options.project
        ? options.project
        : Object.keys(angularJsonFileObject['projects'])[0];
      const projectObject = angularJsonFileObject.projects[project];
      const styles = projectObject.architect.build.options.styles;
      const scripts = projectObject.architect.build.options.scripts;

      allStyles.forEach(style => {
        styles.unshift(style.path);
      });

      additionalScripts.forEach(script => {
        scripts.push(script.path);
      });
      tree.overwrite('angular.json', JSON.stringify(angularJsonFileObject, null, 2));
    } else {
      logger.error('Failed to add scripts or styles to angular.json');
    }

    return tree;
  };
}

function addAdditionalStylesImports(options: Schema): Rule {
  return (tree: Tree) => {
    const workspace = getWorkspace(tree);
    const project = getProjectFromWorkspace(workspace, options.project);
    const stylesFile = getProjectStyleFile(project, 'scss');

    const sectionStyles = `
    @import '~ng-uikit-pro-standard/assets/scss/core/colors';
    @import '~ng-uikit-pro-standard/assets/scss/core/variables';
    @import '~ng-uikit-pro-standard/assets/scss/core/variables-pro';

    @import '~ng-uikit-pro-standard/assets/scss/sections-pro/_contacts-pro.scss';
    @import '~ng-uikit-pro-standard/assets/scss/sections-pro/_magazine-pro.scss';
    @import '~ng-uikit-pro-standard/assets/scss/sections-pro/_pricing-pro.scss';
    @import '~ng-uikit-pro-standard/assets/scss/sections-pro/_social-pro.scss';
    @import '~ng-uikit-pro-standard/assets/scss/sections-pro/_team-pro.scss';
    @import '~ng-uikit-pro-standard/assets/scss/sections-pro/_templates-pro.scss';
    @import '~ng-uikit-pro-standard/assets/scss/sections-pro/_testimonials-pro.scss';
    @import '~ng-uikit-pro-standard/assets/scss/addons-pro/_blog-pro.scss';
    @import '~ng-uikit-pro-standard/assets/scss/addons-pro/_chat-pro.scss';
    @import '~ng-uikit-pro-standard/assets/scss/addons-pro/_ecommerce-pro.scss';
    @import '~ng-uikit-pro-standard/assets/scss/addons-pro/_steppers-pro.scss';
    @import '~ng-uikit-pro-standard/assets/scss/addons-pro/_timeline-pro.scss';
    @import '~ng-uikit-pro-standard/assets/scss/addons-pro/_timelines-pro.scss';
    `;

    if (options.additionalStyles && stylesFile) {
      const recorder = tree.beginUpdate(stylesFile).insertLeft(0, sectionStyles);

      tree.commitUpdate(recorder);
    } else if (options.additionalStyles && !stylesFile) {
      throw new SchematicsException('No root scss file found in the project.');
    }
  };
}
