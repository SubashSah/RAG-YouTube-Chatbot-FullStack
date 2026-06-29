import { useNavigate } from "react-router"
export default function Modal() {
    const navigate = useNavigate();
    return (

        <div
            className="fixed inset-0 flex-col  flex items-center justify-center bg-black/70 "
        >
            <div className="bg-slate-900 p-6 rounded-xl flex flex-col justify-center items-center gap-3">
                <h2 className="font-bold text-2xl">Session Expired!</h2>

                <p>Please load the video to continue.</p>

                <button
                    onClick={() => navigate('/')}
                    className="bg-indigo-700 h-10 px-4 font-semibold text-[14px] rounded-lg cursor-pointer  hover:bg-indigo-500"
                >
                    Go to HomePage
                </button>
            </div>


        </div>

    )
}