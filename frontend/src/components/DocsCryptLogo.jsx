const DocsCryptLogo = ({ className = "h-8 w-8", showText = true, textClassName = "ml-2 text-xl font-bold" }) => {
  return (
    <div className="flex items-center">
      <img
        src="/logo-tanpa-bg.png"
        alt="DocsCrypt Logo"
        className={className}
      />
      {showText && (
        <span className={textClassName}>
          DocsCrypt
        </span>
      )}
    </div>
  );
};

export default DocsCryptLogo;
