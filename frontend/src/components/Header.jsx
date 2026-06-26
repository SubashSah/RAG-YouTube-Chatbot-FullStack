
import { useNavigate } from "react-router";

export default function Header() {
    const navigate = useNavigate();

    function handleClick(){
        navigate('/');
    }

    return (
        <div className="flex items-center h-16 border-b border-b-indigo-300/20 bg-[#070d1f]">
            <div className="flex items-center  gap-2 cursor-pointer mx-4  h-6 "
                onClick={handleClick}
            >
                <img src="youtube-icon.svg" alt="" className="w-10" />
                <div className="flex items-baseline gap-2">
                    <p className="font-medium">YouTube Chatbot</p>
                    <p className="text-[12px] border border-indigo-500/20 rounded-2xl px-1.5 py-0.5 font-semibold text-indigo-400 bg-indigo-500/10">RAG AI</p>
                </div>
            

            </div>
        </div>
    )
}