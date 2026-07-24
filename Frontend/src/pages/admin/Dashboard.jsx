import Navbar from "../../components/Navbar";

export default function Dashboard() {
  return (
    <div className="flex-1 flex flex-col bg-slate-50 font-sans text-slate-900 min-h-screen">
      <Navbar title="Dashboard" />

      <main className="flex-1 flex flex-col w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex-1 flex flex-col items-center justify-center text-center min-h-[400px]">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 mb-4 shadow-sm">
            <i className="fa-solid fa-chart-pie text-2xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard</h2>
          <p className="text-slate-500 max-w-md mt-2 text-sm">
            Welcome to the Safety360 Dashboard. Overview widgets and system statistics will be displayed here.
          </p>
        </div>
      </main>
    </div>
  );
}
