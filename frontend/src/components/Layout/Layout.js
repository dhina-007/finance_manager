import React from "react";
import Header from "./Header";
import Footer from "./Footer";

const Layout = ({ children }) => {
  return (
    <>
      <Header />
      <div className="d-flex flex-column min-vh-100">
        <main className="flex-grow-1">{children}</main>
        <Footer />
      </div>
    </>
  );
};

export default Layout;

