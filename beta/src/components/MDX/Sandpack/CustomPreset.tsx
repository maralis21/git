/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 */
import React from 'react';
// @ts-ignore
import {
  SandpackCodeEditor,
  SandpackReactDevTools,
  SandpackThemeProvider,
  useActiveCode,
  useSandpack,
} from '@codesandbox/sandpack-react';
import cn from 'classnames';
import {flushSync} from 'react-dom';
import scrollIntoView from 'scroll-into-view-if-needed';

import {IconChevron} from 'components/Icon/IconChevron';
import {NavigationBar} from './NavigationBar';
import {Preview} from './Preview';
import {useTypescriptExtension} from './sandpack-tsserver/useTypescriptExtension';
import {CustomTheme} from './Themes';
import {useSandpackLint} from './useSandpackLint';
import {useTypescriptCompiler} from './sandpack-tsserver/useTypescriptCompiler';

export function CustomPreset({
  isSingleFile,
  showDevTools,
  showJsForTsxFiles,
  onDevToolsLoad,
  devToolsLoaded,
}: {
  isSingleFile: boolean;
  showDevTools: boolean;
  showJsForTsxFiles: boolean;
  devToolsLoaded: boolean;
  onDevToolsLoad: () => void;
}) {
  const {lintErrors, lintExtensions} = useSandpackLint();
  const {extension: typescriptExtensions, envId: typescriptEnvId} =
    useTypescriptExtension(showJsForTsxFiles ? 'visible' : 'interaction');
  const {reset: resetTsToJs} = useTypescriptCompiler(
    showJsForTsxFiles,
    typescriptEnvId
  );

  const lineCountRef = React.useRef<{[key: string]: number}>({});
  const containerRef = React.useRef<HTMLDivElement>(null);
  const {sandpack} = useSandpack();
  const [isExpanded, setIsExpanded] = React.useState(false);

  const {activePath} = sandpack;
  const code = sandpack.files[activePath]?.code || '';

  if (!lineCountRef.current[activePath]) {
    lineCountRef.current[activePath] = code.split('\n').length;
  }
  const lineCount = lineCountRef.current[activePath];
  const isExpandable = lineCount > 16 || isExpanded;

  return (
    <>
      <div
        className="shadow-lg dark:shadow-lg-dark rounded-lg"
        ref={containerRef}>
        <NavigationBar showDownload={isSingleFile} onReset={resetTsToJs} />
        <SandpackThemeProvider theme={CustomTheme}>
          <div
            ref={sandpack.lazyAnchorRef}
            className={cn(
              'sp-layout sp-custom-layout',
              showDevTools && devToolsLoaded && 'sp-layout-devtools',
              isExpanded && 'sp-layout-expanded'
            )}>
            <SandpackCodeEditor
              showLineNumbers
              showInlineErrors
              showTabs={false}
              showRunButton={false}
              extensions={[lintExtensions, typescriptExtensions]}
            />
            <Preview
              className="order-last xl:order-2"
              isExpanded={isExpanded}
              lintErrors={lintErrors}
            />
            {isExpandable && (
              <button
                translate="yes"
                className="flex text-base justify-between dark:border-card-dark bg-wash dark:bg-card-dark items-center z-10 rounded-t-none p-1 w-full order-2 xl:order-last border-b-1 relative top-0"
                onClick={() => {
                  const nextIsExpanded = !isExpanded;
                  flushSync(() => {
                    setIsExpanded(nextIsExpanded);
                  });
                  if (!nextIsExpanded && containerRef.current !== null) {
                    scrollIntoView(containerRef.current, {
                      scrollMode: 'if-needed',
                      block: 'nearest',
                      inline: 'nearest',
                    });
                  }
                }}>
                <span className="flex p-2 focus:outline-none text-primary dark:text-primary-dark">
                  <IconChevron
                    className="inline mr-1.5 text-xl"
                    displayDirection={isExpanded ? 'up' : 'down'}
                  />
                  {isExpanded ? 'Show less' : 'Show more'}
                </span>
              </button>
            )}
          </div>

          {showDevTools && (
            <SandpackReactDevTools onLoadModule={onDevToolsLoad} />
          )}
        </SandpackThemeProvider>
      </div>
    </>
  );
}
