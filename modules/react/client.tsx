
/**
 * client-side "main". need to make part of flow and auto create.
 * @note are aliases going to be an issue for template creation..
 * (dynamically, quite likely)
 */

import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

///////////////////////
// these are just for me
import RootLayout from '@/app/layout';
import AboutPage from '@/app/about/page';
import ResumePage from '@/app/resume/page';
import ProjectsPage from '@/app/projects/page';

const router = createBrowserRouter([
  { path: '/about', element: <RootLayout><AboutPage /></RootLayout> },
  { path: '/resume', element: <RootLayout><ResumePage /></RootLayout> },
  { path: '/projects', element: <RootLayout><ProjectsPage /></RootLayout> }
]);
//////////////////////


hydrateRoot(document, <RouterProvider router={router} />);
