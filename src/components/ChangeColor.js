import React, { useState, useContext, useEffect } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { ColorIcon } from "./Icons";
import { Wrapper } from "./ToggleTheme";

const ChangeColor = () => {
  const { theme, setTheme } = useContext(ThemeContext);

  const colors = [
    "#CA2055",
    "#1DA1F2",
    "#FFAD1F",
    "#794BC4",
    "#F45D22",
    "#17BF63",
  ];

  const [currentColor, setCurrentColor] = useState(colors[0]);

  // Sync initial color with the theme context
  useEffect(() => {
    if (theme.accentColor && colors.includes(theme.accentColor)) {
      setCurrentColor(theme.accentColor);
    }
  }, [theme.accentColor]);

  const changeColor = () => {
    let newAccentColor;

    if (colors.indexOf(currentColor) === colors.length - 1) {
      newAccentColor = colors[0];
    } else {
      newAccentColor = colors[colors.indexOf(currentColor) + 1];
    }

    setTheme({
      ...theme,
      accentColor: newAccentColor,
    });

    setCurrentColor(newAccentColor);
  };

  return (
    <Wrapper onClick={changeColor}>
      <ColorIcon sm color={theme.accentColor} />
      <p>Color</p>
    </Wrapper>
  );
};

export default ChangeColor;
