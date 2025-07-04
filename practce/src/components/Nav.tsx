export const Nav = () => {
    return (
        <div className="w-full flex justify-center items-center h-20 bg-gradient-to-r from-black-100 via-black-600 to-black-900">
            {/* Logo/Icon */}
            <div className="flex items-center mr-3">
                <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
                    <circle cx="24" cy="24" r="22" fill="#2563eb" stroke="#fff" strokeWidth="3" />
                    <path d="M16 28c0-4 3.5-7 8-7s8 3 8 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="20" cy="20" r="2" fill="#fff" />
                    <circle cx="28" cy="20" r="2" fill="#fff" />
                </svg>
            </div>
            <h1 className="text-white text-[2rem] font-extrabold tracking-wide font-sans drop-shadow-lg select-none">
                AI Avatar <span className="text-blue-200">Interaction</span>
            </h1>
        </div>
    );
}