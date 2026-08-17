import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import moment from "moment";
import { ChevronUp } from "lucide-react";
import { INews } from "../../../types/global_types";
import { ParsingItem } from "./styles";

interface IProps {
  item: INews;
}

const stripHtml = (value?: string): string =>
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getUpdateType = (type?: string): string => {
  const normalizedType = String(type || "").trim();

  return normalizedType || "Info";
};

const FomoUpdateItem: FC<IProps> = ({ item }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isToggleVisible, setIsToggleVisible] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);
  const text = useMemo(() => stripHtml(item.text), [item.text]);

  const measureTextOverflow = useCallback(() => {
    const textElement = textRef.current;

    if (!textElement) return;

    const wasExpanded = textElement.classList.contains("expanded");

    if (wasExpanded) {
      textElement.classList.remove("expanded");
    }

    const isOverflowing =
      textElement.scrollHeight > textElement.clientHeight + 1;

    if (wasExpanded) {
      textElement.classList.add("expanded");
    }

    setIsToggleVisible(isOverflowing);

    if (!isOverflowing) {
      setIsExpanded(false);
    }
  }, []);

  useEffect(() => {
    setIsExpanded(false);
  }, [text]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(measureTextOverflow);

    window.addEventListener("resize", measureTextOverflow);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", measureTextOverflow);
    };
  }, [measureTextOverflow, text]);

  return (
    <ParsingItem variant="main">
      <div className="update-header">
        <div className="update-title-row">
          <h3>{item.title}</h3>
          <span className="update-badge">{getUpdateType(item.type)}</span>
        </div>
        <time dateTime={item.date ? new Date(item.date).toISOString() : undefined}>
          {item.date ? moment(item.date).fromNow() : ""}
        </time>
      </div>

      <p
        ref={textRef}
        className={isExpanded ? "update-text expanded" : "update-text"}
      >
        {text || "-"}
      </p>

      <div className="update-footer">
        {isToggleVisible ? (
          <button
            className={isExpanded ? "toggle-button expanded" : "toggle-button"}
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
          >
            {isExpanded ? "Show less" : "Show more"}
            <ChevronUp size={14} strokeWidth={1.8} />
          </button>
        ) : (
          <span />
        )}
        <span className="read-status">&#10003; Read</span>
      </div>
    </ParsingItem>
  );
};

export default FomoUpdateItem;

