
import { useEffect, useState } from "react";

import { getVideoId } from "../utils/getVideoId";


export default function VideoInsights({ url }) {
    const [meta, setMeta] = useState(null);


    const videoId = getVideoId(url);

    useEffect(() => {
        if (!url) return;

        async function fetchMeta() {
            const res = await fetch(
                `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
            );
            const data = await res.json();
            setMeta(data);
        }

        fetchMeta();
    }, [url]);


    if (!url) return <p>No video provided.</p>;

    return (
        <>
            <h2 className="text-l font-bold m-3">Video Insights</h2>
            <div className="border border-slate-700 my-4"></div>

            <div className="mx-2 ">
                <div className="my-4">
                    {videoId && (
                        <iframe
                            width='100%'
                            height='400'
                            src={`https://www.youtube.com/embed/${videoId}`}
                            allowFullScreen
                        />
                    )}
                </div>

                <div className="my-4">
                    <p className="font-semibold">Video Title:</p>
                    <p className="bg-slate-900 border-2 border-slate-700 px-2 py-1 rounded-md">{meta?.title}</p>
                </div>

                <div className="my-4"> 
                    <p className="font-semibold">Channel:</p>
                    <p className="bg-slate-900 border-2 border-slate-700 px-2 py-1 rounded-md">[{meta?.author_name}]</p>
                </div>
            </div>
        </>
    )
}