import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Log } from '@microsoft/sp-core-library';
import {
  BaseApplicationCustomizer,
  PlaceholderContent,
  PlaceholderName
} from '@microsoft/sp-application-base';

import * as strings from 'HelloExtensionApplicationCustomizerStrings';
import { Navbar } from './components/Navbar';
import '../../styles/tailwind.generated.css';

const LOG_SOURCE: string = 'HelloextensionApplicationCustomizer';

export interface IHelloextensionApplicationCustomizerProperties {
  testMessage: string;
}

export default class HelloextensionApplicationCustomizer
  extends BaseApplicationCustomizer<IHelloextensionApplicationCustomizerProperties> {

  private _topPlaceholder: PlaceholderContent | undefined;

  public async onInit(): Promise<void> {
    await super.onInit();
    Log.info(LOG_SOURCE, `Initialized ${strings.Title}`);

    // Wait for the placeholders to be created (or handle them when they are)
    this.context.placeholderProvider.changedEvent.add(this, this._renderPlaceHolders);
  }

  private _renderPlaceHolders(): void {
    console.log('HelloextensionApplicationCustomizer._renderPlaceHolders()');
    console.log('Available placeholders: ',
      this.context.placeholderProvider.placeholderNames.map(name => PlaceholderName[name]).join(', '));

    // Handling the top placeholder
    if (!this._topPlaceholder) {
      this._topPlaceholder =
        this.context.placeholderProvider.tryCreateContent(
          PlaceholderName.Top,
          { onDispose: this._onDispose.bind(this) }
        );

      // The extension should not assume that the expected placeholder is available.
      if (!this._topPlaceholder) {
        console.error('The expected placeholder (Top) was not found.');
        return;
      }

      if (this._topPlaceholder.domElement) {
        const element: React.ReactElement = React.createElement(
          Navbar,
          {
            userDisplayName: this.context.pageContext.user.displayName
          }
        );

        ReactDom.render(element, this._topPlaceholder.domElement);
      }
    }
  }

  private _onDispose(): void {
    if (this._topPlaceholder && this._topPlaceholder.domElement) {
      ReactDom.unmountComponentAtNode(this._topPlaceholder.domElement);
    }
    console.log('[HelloextensionApplicationCustomizer._onDispose] Disposing of render placeholders.');
  }
}
