import React, { useState } from "react";
import { X } from "lucide-react";
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  CloseButton,
  ModalBody,
  FormSection,
  SectionLabel,
  RadioGroup,
  RadioOption,
  TextInput,
  HintText,
  InfoBox,
  FooterNote,
  ModalFooter,
  CancelButton,
  SubmitButton,
} from "./CreatePredictionModal.styles";
import ModalDatePicker from "../../../global/common/components_for_modals/modal_date_picker";
import { TextareaWrapper } from "../../../global/modals/BuyModal/styles";
import { Textarea } from "../../projects/modals/P2PBuyModal/styles";
import CustomDropdown from "../../../UI/CustomDropdown";

interface CreatePredictionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PredictionType = "single" | "multi-level" | "tge-ido";

export const CreatePredictionModal: React.FC<CreatePredictionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [predictionType, setPredictionType] =
    useState<PredictionType>("single");
  const [predictionQuestion, setPredictionQuestion] = useState("");

  // Multi-level state
  const [multiLevelOptions, setMultiLevelOptions] = useState<string[]>([
    "",
    "",
    "",
  ]);

  // TGE/IDO state
  const [selectedProject, setSelectedProject] = useState("");
  const [tgeDate, setTgeDate] = useState("");

  // Project options for dropdown
  const projectOptions = [
    { value: "project1", label: "Project 1" },
    { value: "project2", label: "Project 2" },
    { value: "project3", label: "Project 3" },
  ];

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = () => {
    // Handle submission logic here
    console.log({
      predictionType,
      predictionQuestion,
      ...(predictionType === "multi-level" && { multiLevelOptions }),
      ...(predictionType === "tge-ido" && { selectedProject, tgeDate }),
    });
    onClose();
  };

  const updateMultiLevelOption = (index: number, value: string) => {
    const newOptions = [...multiLevelOptions];
    newOptions[index] = value;

    // If user is typing in the last empty input and there are less than 4 options, add a new empty one
    if (
      index === multiLevelOptions.length - 1 &&
      value.trim() &&
      multiLevelOptions.length < 4
    ) {
      newOptions.push("");
    }

    setMultiLevelOptions(newOptions);
  };

  const handleMultiLevelBlur = () => {
    // Remove trailing empty options, but keep at least 3 options (2 fields + 1 "Add another")
    const filledCount = multiLevelOptions.filter((opt) => opt.trim()).length;

    if (filledCount >= 2) {
      // Keep only filled options plus one empty "Add another" at the end
      const filled = multiLevelOptions.filter((opt) => opt.trim());
      if (filled.length < 4) {
        setMultiLevelOptions([...filled, ""]);
      } else {
        setMultiLevelOptions(filled);
      }
    } else {
      // Keep at least 3 empty slots if less than 2 are filled
      setMultiLevelOptions(["", "", ""]);
    }
  };

  const getOutcomeDescription = () => {
    switch (predictionType) {
      case "single":
        return "This prediction has a single Yes/No outcome.";
      case "multi-level":
        return `Users choose from multiple options. In this case: ${multiLevelOptions
          .filter((opt) => opt.trim())
          .join(", ")}.`;
      case "tge-ido":
        return "Users predict if the project will be Bullish or Bearish at TGE/IDO/Launch.";
      default:
        return "";
    }
  };

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContent>
        <ModalHeader>
          <h2>Create Prediction</h2>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <FormSection>
            <SectionLabel>Prediction type</SectionLabel>
            <RadioGroup>
              <RadioOption>
                <input
                  type="radio"
                  name="prediction-type"
                  value="single"
                  checked={predictionType === "single"}
                  onChange={() => setPredictionType("single")}
                />
                <span>
                  <span className="option-label">Single</span>
                  <span className="option-description">(Yes/No)</span>
                </span>
              </RadioOption>
              <RadioOption>
                <input
                  type="radio"
                  name="prediction-type"
                  value="multi-level"
                  checked={predictionType === "multi-level"}
                  onChange={() => setPredictionType("multi-level")}
                />
                <span>
                  <span className="option-label">Multi-Level</span>
                  <span className="option-description">(Yes/No)</span>
                </span>
              </RadioOption>
              <RadioOption>
                <input
                  type="radio"
                  name="prediction-type"
                  value="tge-ido"
                  checked={predictionType === "tge-ido"}
                  onChange={() => setPredictionType("tge-ido")}
                />
                <span>
                  <span className="option-label">TGE / IDO / Launch</span>
                  <span className="option-description">(Bull/Bear)</span>
                </span>
              </RadioOption>
            </RadioGroup>
          </FormSection>

          {predictionType === "single" && (
            <>
              <FormSection>
                <SectionLabel>Prediction question</SectionLabel>
                <TextareaWrapper>
                  <Textarea
                    placeholder="Enter prediction question"
                    value={predictionQuestion}
                    onChange={(e) => setPredictionQuestion(e.target.value)}
                  />
                </TextareaWrapper>
                <HintText>
                  The question must be specific, verifiable, and have a clear
                  resolution source.
                </HintText>
              </FormSection>
              <FormSection>
                <SectionLabel>Outcome</SectionLabel>
                <InfoBox>This prediction has a single Yes/No outcome.</InfoBox>
              </FormSection>
            </>
          )}

          {predictionType === "multi-level" && (
            <>
              <FormSection>
                <SectionLabel>Prediction question</SectionLabel>
                <TextInput
                  type="text"
                  placeholder="Enter prediction question"
                  value={predictionQuestion}
                  onChange={(e) => setPredictionQuestion(e.target.value)}
                />
                <HintText>
                  The question must be specific, verifiable, and have a clear
                  resolution source.
                </HintText>
              </FormSection>

              <FormSection>
                <SectionLabel>Levels (2-4)</SectionLabel>
                <RadioGroup>
                  {multiLevelOptions.map((option, index) => (
                    <TextInput
                      key={index}
                      type="text"
                      placeholder={
                        index === multiLevelOptions.length - 1 &&
                        multiLevelOptions.length < 4
                          ? "Add another option..."
                          : `Option ${index + 1}`
                      }
                      value={option}
                      onChange={(e) =>
                        updateMultiLevelOption(index, e.target.value)
                      }
                      onBlur={handleMultiLevelBlur}
                    />
                  ))}
                </RadioGroup>
              </FormSection>
            </>
          )}

          {predictionType === "tge-ido" && (
            <>
              <FormSection>
                <SectionLabel>Select a project</SectionLabel>
                <CustomDropdown
                  options={projectOptions}
                  value={selectedProject}
                  onChange={(value) => setSelectedProject(value as string)}
                  placeholder="Select a project"
                  searchable={true}
                  showIcons={false}
                  isShowSuccess={false}
                />
              </FormSection>

              <FormSection>
                <SectionLabel>TGE Date</SectionLabel>
                <div className="date-picker">
                  <ModalDatePicker
                    date={tgeDate ? new Date(tgeDate) : null}
                    onChange={(date) =>
                      setTgeDate(date ? date.toISOString() : "")
                    }
                    type="default"
                    isSuccessIcon={!!tgeDate}
                  />
                </div>
              </FormSection>
            </>
          )}

          <FooterNote>
            *Predictions are reviewed before being published.
          </FooterNote>
        </ModalBody>

        <ModalFooter>
          <CancelButton onClick={onClose}>Cancel</CancelButton>
          <SubmitButton
            onClick={handleSubmit}
            disabled={
              (predictionType === "single" && !predictionQuestion.trim()) ||
              (predictionType === "multi-level" &&
                (!predictionQuestion.trim() ||
                  multiLevelOptions.filter((opt) => opt.trim()).length < 2)) ||
              (predictionType === "tge-ido" && (!selectedProject || !tgeDate))
            }
          >
            Submit for review
          </SubmitButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};
