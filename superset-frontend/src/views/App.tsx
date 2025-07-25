/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0.
 */

import { Suspense, useEffect } from 'react';
import { hot } from 'react-hot-loader/root';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  useLocation,
} from 'react-router-dom';
import { bindActionCreators } from 'redux';
import { css } from '@superset-ui/core';
import { GlobalStyles } from 'src/GlobalStyles';
import ErrorBoundary from 'src/components/ErrorBoundary';
import Loading from 'src/components/Loading';
import { Layout } from 'src/components';
import Menu from 'src/features/home/Menu';
import getBootstrapData from 'src/utils/getBootstrapData';
import ToastContainer from 'src/components/MessageToasts/ToastContainer';
import setupApp from 'src/setup/setupApp';
import setupPlugins from 'src/setup/setupPlugins';
import setupExtensions from 'src/setup/setupExtensions';
import { routes, isFrontendRoute } from 'src/views/routes';
import { Logger, LOG_ACTIONS_SPA_NAVIGATION } from 'src/logger/LogUtils';
import { logEvent } from 'src/logger/actions';
import { store } from 'src/views/store';
import { RootContextProviders } from './RootContextProviders';
import { ScrollToTop } from './ScrollToTop';
import ChatIcon from 'src/components/ChatIcon/ChatIcon';

setupApp();
setupPlugins();
setupExtensions();

const bootstrapData = getBootstrapData();

let lastLocationPathname: string;

const boundActions = bindActionCreators({ logEvent }, store.dispatch);

const LocationPathnameLogger = () => {
  const location = useLocation();
  useEffect(() => {
    boundActions.logEvent(LOG_ACTIONS_SPA_NAVIGATION, {
      path: location.pathname,
    });
    if (lastLocationPathname && lastLocationPathname !== location.pathname) {
      Logger.markTimeOrigin();
    }
    lastLocationPathname = location.pathname;
  }, [location.pathname]);
  return null;
};

const App: React.FC = () => (
  <Router>
    <ScrollToTop />
    <LocationPathnameLogger />
    <RootContextProviders>
      <GlobalStyles />
      <Menu
        data={bootstrapData.common.menu_data}
        isFrontendRoute={isFrontendRoute}
      />
      <Switch>
        {routes.map(({ path, Component, props = {}, Fallback = Loading }) => (
          <Route path={path} key={path}>
            <Suspense fallback={<Fallback />}>
              <Layout.Content
                css={css`
                  display: flex;
                  flex-direction: column;
                `}
              >
                <ErrorBoundary
                  css={css`
                    margin: 16px;
                  `}
                >
                  <Component user={bootstrapData.user} {...props} />
                </ErrorBoundary>
              </Layout.Content>
            </Suspense>
          </Route>
        ))}
      </Switch>
      <ToastContainer />
      {/* Floating chat icon on every page */}
      <ChatIcon />
    </RootContextProviders>
  </Router>
);

export default hot(App);