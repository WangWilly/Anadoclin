import React from "react";
import type { AppProps } from "next/app";
import PageTransition from "../components/PageTransition";

import "../styles/globals.css";

////////////////////////////////////////////////////////////////////////////////

function MyApp({ Component, pageProps, router }: AppProps) {
  return (
    <PageTransition>
      <Component {...pageProps} key={router.route} />
    </PageTransition>
  );
}

export default MyApp;
