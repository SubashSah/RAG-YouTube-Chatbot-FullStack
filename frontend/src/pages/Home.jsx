
import { useState, useEffect, useRef } from "react";
import { redirect, useSubmit, useActionData, useNavigation } from 'react-router';

import { LuSparkles } from "react-icons/lu";
import { RiYoutubeLine } from "react-icons/ri";
import { FaArrowRight } from "react-icons/fa6";
import LoadingModal from "../components/LoadingModal";

export default function HomePage() {
    const [url, setUrl] = useState("");
    const [showError, setShowError] = useState(true);
    const dialogRef = useRef();

    const submit = useSubmit();
    const data = useActionData();
    const navigation = useNavigation();

    function OnChange(e) {
        setUrl(e.target.value);
        setShowError(false);
    }

    useEffect(() => {

        if (data) {
            setShowError(true);
        }
    }, [data])

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (navigation.state !== "idle") {
            if (!dialog.open) {
                dialog.showModal();
            }
        } else {
            if (dialog.open) {
                dialog.close()
            }
        }
    }, [navigation.state]);

    function handleClick() {
        const formData = new FormData();
        formData.append("youtube_url", url);
        setUrl("");

        submit(formData, { method: "post" });

    };

    return (
        <>
            <LoadingModal ref={dialogRef} />
            <div className="flex flex-col  items-center gap-2  flex-wrap relative top-50">
                <div className="flex items-center gap-2.5 text-indigo-400 font-semibold text-[13px] border border-slate-700  py-1 px-2 rounded-full bg-slate-00">
                    <LuSparkles />
                    <p>Semantic Video Search & Chat</p>
                </div>
                <p className="w-xl text-5xl font-extrabold leading-tight tracking-tight text-center ">Chat with any <span className="bg-linear-to-r from-red-500 via-orange-400 to-indigo-400 bg-clip-text text-transparent">YouTube Video</span> </p>

                <p className="text-slate-400 mb-5">Please paste the link of the video to continue</p>

                <div className="bg-slate-900 flex items-center justify-center gap-2 h-16 w-2xl p-3 rounded-xl border border-slate-700  shadow-[0_0_15px_rgba(99,102,241,0.25)] ">
                    <RiYoutubeLine size='30px' color="red" />
                    <input
                        type="text"
                        value={url}
                        onChange={OnChange}
                        placeholder="Paste YouTube video URL here (e.g., https://www.youtube.com/watch?v=...)"
                        className="w-full bg-slate-900 outline-none"
                    />
                    <button

                        onClick={handleClick}
                        disabled={!url.trim()}
                        className="bg-indigo-600 flex justify-center items-center gap-1 h-10 w-35 p-2 font-semibold text-[14px] rounded-lg cursor-pointer hover:bg-indigo-500 disabled:cursor-not-allowed"
                    >
                        Analyze
                        <FaArrowRight />
                    </button>
                </div>
                {showError && data &&
                    <p>{data.message}</p>
                }

            </div>



        </>
    )
}

export async function action({ request }) {
    const data = await request.formData();
    const youtube_url = data.get('youtube_url');

    const API_URL = import.meta.env.VITE_API_URL;
    const response = await fetch(`${API_URL}/load-video`, {
        method: request.method,
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ youtube_url })
    });

    const result = await response.json();

    if (!response.ok) {
        if (response.status === 400) {
            return {
                message: result.detail, //goes to useActionData
            }
        }
        else throw new Response(JSON.stringify({
            message: result.detail
        }),
            {
                status: response.status //goes to errorElement page.
            });
    }

    return redirect("/chat?url=" + encodeURIComponent(youtube_url));

}

