import React from "react";

const Input = ({
  text,
  type = "text",
  value,
  onChange,
  placeholder = "",
  name,
  id,
  className = "",
  required = false,
  disabled = false,
}) => {
  return (
    <div>
      <h1 className="font-HelvicaRegular mb-1 text-xs">{text}</h1>
      <input
        text={text}
        value={value}
        type={type}
        onChange={onChange}
        placeholder={placeholder}
        name={name}
        id={id}
        className={`bg-[#1a1a1a] w-full py-4 px-5 outline-none rounded-3xl ${className}`}
        required={required}
        disabled={disabled}
      />
    </div>
  );
};

export default Input;
