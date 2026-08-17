import React, { useState } from "react";
import FAQandRiskArrow from "../Icons/FAQandRiskArrow";
import { FAQItem } from "../../../types/global_types";

function FAQandRisks({ faq }: { faq: Array<FAQItem> }) {
  const [faqItems, setFaqItems] = useState<Array<FAQItem>>(faq);

  const toggleSection = (faqIndex: number, faqSection: number) => {
    setFaqItems((prev: Array<FAQItem>) => {
      return prev.map((item: FAQItem, faqI: number) => {
        if (faqI === faqIndex) {
          return {
            ...item,
            items: item.items.map((section: any, secI: number) => {
              if (secI === faqSection) {
                return { ...section, isOpen: !section?.isOpen };
              }
              return section;
            }),
          };
        }
        return item;
      });
    });
  };

  return (
    <>
      <br />
      <div className="accordion__items-list">
        {faqItems.map((item: FAQItem, faqItemIndex: number) => {
          return (
            <div className="accordion_wrapper__PRgak">
              <h4 className="sub-title_subTitle__1FuQc">{item.title}</h4>
              <p className="subtitle">{item.description}</p>
              <div className="accordion_body__asfCV accordion_open__open">
                {item.items.map(
                  (
                    section: {
                      title: string;
                      description: string;
                      isOpen?: boolean;
                    },
                    faqSectionIndex: number
                  ) => {
                    return (
                      <button
                        className="accordion_accItem__l5bls"
                        onClick={() =>
                          toggleSection(faqItemIndex, faqSectionIndex)
                        }
                      >
                        <div className="accordion_accToggle__7Hefo">
                          <span>{section.title}</span>
                          <FAQandRiskArrow
                            style={{
                              color: "transparent",
                              transform: `rotate(${section?.isOpen ? 180 : 0}deg)`,
                            }}
                          />
                        </div>
                        {section?.isOpen && (
                          <div className="accordion_text__cZySK">
                            {section.description}
                          </div>
                        )}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default FAQandRisks;
