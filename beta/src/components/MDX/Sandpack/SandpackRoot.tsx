/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

import {Children, useState} from 'react';
import * as React from 'react';
import {SandpackProvider} from '@codesandbox/sandpack-react';
import {SandpackLogLevel} from '@codesandbox/sandpack-client';
import {CustomPreset} from './CustomPreset';
import {createFileMap} from './createFileMap';
import {CustomTheme} from './Themes';
import {SnippetTargetLanguageContext} from './SnippetLanguage';

type SandpackProps = {
  children: React.ReactNode;
  autorun?: boolean;
  defaultActiveFile: string;
  showDevTools?: boolean;
};

const sandboxStyle = `
* {
  box-sizing: border-box;
}

body {
  font-family: sans-serif;
  margin: 20px;
  padding: 0;
}

h1 {
  margin-top: 0;
  font-size: 22px;
}

h2 {
  margin-top: 0;
  font-size: 20px;
}

h3 {
  margin-top: 0;
  font-size: 18px;
}

h4 {
  margin-top: 0;
  font-size: 16px;
}

h5 {
  margin-top: 0;
  font-size: 14px;
}

h6 {
  margin-top: 0;
  font-size: 12px;
}

code {
  font-size: 1.2em;
}

ul {
  padding-left: 20px;
}
`.trim();

function SandpackRoot(props: SandpackProps) {
  let {
    children,
    autorun = true,
    defaultActiveFile,
    showDevTools = false,
  } = props;
  const [devToolsLoaded, setDevToolsLoaded] = useState(false);
  const codeSnippets = Children.toArray(children) as React.ReactElement[];
  const {snippetTargetLanguage} = React.useContext(
    SnippetTargetLanguageContext
  );
  const {files, hasTSVersion} = createFileMap(
    codeSnippets,
    snippetTargetLanguage
  );

  files['/styles.css'] = {
    code: [sandboxStyle, files['/styles.css']?.code ?? ''].join('\n\n'),
    hidden: files['/styles.css']?.hidden,
  };

  return (
    <div className="sandpack sandpack--playground my-8">
      <SandpackProvider
        template={snippetTargetLanguage === 'ts' ? 'react-ts' : 'react'}
        files={files}
        theme={CustomTheme}
        options={{
          activeFile: defaultActiveFile,
          autorun,
          initMode: 'user-visible',
          initModeObserverOptions: {rootMargin: '1400px 0px'},
          bundlerURL: 'https://dad0ba0e.sandpack-bundler-4bw.pages.dev',
          logLevel: SandpackLogLevel.None,
        }}>
        <CustomPreset
          showDevTools={showDevTools}
          onDevToolsLoad={() => setDevToolsLoaded(true)}
          devToolsLoaded={devToolsLoaded}
          hasTSVersion={hasTSVersion}
          providedFiles={Object.keys(files)}
        />
      </SandpackProvider>
    </div>
  );
}

export default SandpackRoot;
