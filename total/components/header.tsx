"use client";

export function Header() {
  const handleEmergencyClick = () => {
    window.open('https://hosting-b1ze.onrender.com/', '_blank', 'noopener,noreferrer');
  };

  return (
    <header className="bg-orange-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Sahayta</h1>
          <p className="text-orange-100">Monitor healthcare, natural events, and catastrophes across India</p>
        </div>
        <button
          onClick={handleEmergencyClick}
          className="mt-4 md:mt-0 bg-white text-orange-600 font-semibold py-2 px-4 rounded hover:bg-orange-100 transition"
        >
          Emergency response
        </button>
      </div>
    </header>
  );
}