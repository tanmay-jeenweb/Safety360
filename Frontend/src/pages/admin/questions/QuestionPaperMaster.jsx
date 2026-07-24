import Navbar from "../../../components/Navbar";

export default function QuestionPaperMaster() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar />
            <div className="flex-1 p-6 max-w-7xl w-full mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Question Paper</h1>
                        <p className="text-sm text-slate-500 mt-1">Create and manage training question papers</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                    <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm border border-orange-100">
                        <i className="fa-solid fa-file-signature"></i>
                    </div>
                    <h2 className="text-lg font-bold text-slate-800 mb-1">Question Paper Management</h2>
                    <p className="text-sm text-slate-500 max-w-md mx-auto">
                        This module will allow assembling question papers from Question Bank for pre-test and post-test assessments.
                    </p>
                </div>
            </div>
        </div>
    );
}
