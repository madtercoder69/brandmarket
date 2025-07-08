import React from "react";

const Button = ({
  onClick,
  type = "button",
  children,
  className = "",
  ...props
}) => {
  return (
    <button
      onClick={onClick}
      type={type}
      className={`bg-[#f7931e] py-4 px-5 rounded-3xl transition-opacity hover:opacity-[0.8] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
