function Logo({ onClose }) {
  return (
    <div className="flex items-center gap-[6px]">
      <button className="menu-btn hidden items-center justify-center bg-[#1d1d1d] border border-[#464748] text-[20px] p-1 rounded-lg cursor-pointer max-2xl:flex max-2xl:text-white" onClick={onClose}>
        <i className="bx bx-log-out-circle text-[24px] transition-all duration-300 ease-in-out"></i>
      </button>
      <i className="bx bx-pulse text-[24px] transition-all duration-300 ease-in-out text-white"></i>
      <a
        href="/"
        className="font-bold transition-all duration-300 ease-in-out text-white hover:text-[#5773ff]"
      >
        MoodScape
      </a>
    </div>
  );
}

export default Logo;
