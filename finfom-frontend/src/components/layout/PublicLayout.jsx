const PublicLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Optional simple header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-primary-600">Finfom</h1>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
};

export default PublicLayout;