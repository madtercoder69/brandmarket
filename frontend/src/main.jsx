import { createRoot } from "react-dom/client";
import "./index.css";
import "./media.css";
import App from "./App.jsx";
import { Provider } from "react-redux";
import store from "./store/index.js";
import { BrowserRouter } from "react-router-dom";
import i18n from "./utils/i18n.js";
import { Suspense } from "react";

const loadFonts = async () => {
  try {
    const fontPromises = [
      new FontFace('HelvicaRegular', 'url(/fonts/helvetica_regular.woff2)', { display: 'swap' }),
      new FontFace('SaharHeavy', 'url(/fonts/sahar-heavy.woff2)', { display: 'swap' })
    ];

    const fonts = await Promise.allSettled(fontPromises.map(font => font.load()));
    fonts.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        document.fonts.add(result.value);
      }
    });
  } catch (error) {
    console.warn('Font loading failed, using fallbacks:', error);
  }
};

loadFonts().finally(() => {
  createRoot(document.getElementById("root")).render(
    <Provider store={store}>
      <BrowserRouter>
        <Suspense>
          <App />
        </Suspense>
      </BrowserRouter>
    </Provider>
  );
});
