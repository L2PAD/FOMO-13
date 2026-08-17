import html2canvas from "html2canvas";
import getAuthToken from "../getAuthToken";
import { API } from "../../config/api";

export interface ScreenshotResponse {
    isSuccess: boolean;
    error: string;
    url?: string;
    fileName?: string;
}

export const makeScreenshot = async (id: string): Promise<ScreenshotResponse> => {
    const cleanupHandlers: Array<() => void> = [];

    try {
        const elem = document.getElementById(`item-${id}`);
        if (!elem) {
            return { isSuccess: false, error: "Element not found" };
        }

        const setStyleWithCleanup = (
            node: HTMLElement,
            property: keyof CSSStyleDeclaration,
            value: string
        ) => {
            const previousValue = node.style[property] as string;
            (node.style[property] as string) = value;
            cleanupHandlers.push(() => {
                (node.style[property] as string) = previousValue;
            });
        };

        // html2canvas may render both faces of a 3D-flipped mobile card.
        // For screenshot generation, always force the front face only.
        const flipCard = elem.querySelector<HTMLElement>("[data-screenshot-flip-card]");
        const frontFace = elem.querySelector<HTMLElement>("[data-screenshot-face='front']");
        const backFace = elem.querySelector<HTMLElement>("[data-screenshot-face='back']");

        if (flipCard) {
            setStyleWithCleanup(flipCard, "transform", "none");
            setStyleWithCleanup(flipCard, "transition", "none");
        }

        if (frontFace) {
            setStyleWithCleanup(frontFace, "display", "flex");
            setStyleWithCleanup(frontFace, "visibility", "visible");
            setStyleWithCleanup(frontFace, "opacity", "1");
            setStyleWithCleanup(frontFace, "transform", "none");
            setStyleWithCleanup(frontFace, "zIndex", "2");
            setStyleWithCleanup(frontFace, "backfaceVisibility", "visible");
        }

        if (backFace) {
            setStyleWithCleanup(backFace, "display", "none");
            setStyleWithCleanup(backFace, "visibility", "hidden");
            setStyleWithCleanup(backFace, "opacity", "0");
            setStyleWithCleanup(backFace, "zIndex", "0");
        }

        const accessToken: string | null = getAuthToken();

        const canvas = await html2canvas(elem, {
            useCORS: true,
            scale: 2,
        });

        const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob((b) => resolve(b), "image/png")
        );

        if (!blob) {
            return { isSuccess: false, error: "Failed to generate image blob" };
        }

        const formData = new FormData();
        formData.append("file", blob, `${id}.png`);

        const res = await fetch(
            `${API}/deals/upload-screenshot`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                body: formData,
            }
        );

        const data = await res.json();

        return {
            isSuccess: res.status < 300,
            error: data?.message || "",
            url: data?.url,
            fileName: data?.fileName,
        };

    } catch (error) {
        console.error("Screenshot error:", error);

        return {
            isSuccess: false,
            error: "Unexpected error while generating screenshot",
        };
    } finally {
        while (cleanupHandlers.length) {
            const cleanup = cleanupHandlers.pop();
            cleanup?.();
        }
    }
};
