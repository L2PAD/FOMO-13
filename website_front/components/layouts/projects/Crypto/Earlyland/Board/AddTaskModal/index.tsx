import React, { FC, useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  AddButton,
  CancelButton,
  CloseButton,
  DatePickerGlobalStyles,
  DatePickerTrigger,
  DescHint,
  FieldError,
  FieldInput,
  FieldLabel,
  FieldTextarea,
  FormBody,
  FormField,
  FormRow,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalWrapper,
  Overlay,
  SelectDropdown,
  SelectOption,
  SelectPlaceholder,
  SelectTrigger,
  SelectWrapper,
} from "./styles";
import { BoardTask, TaskCategoryVariant, TaskDifficultyVariant, TaskStatus } from "../types";
import { XIcon, ChevronDown, CalendarIcon } from "../../../../../../global/Icons/Earlyland/icons";
import { useTranslation } from "i18n";


const DatePickerCustomInput = React.forwardRef<
  HTMLButtonElement,
  { value?: string; onClick?: () => void; hasError?: boolean }
>(({ value, onClick, hasError }, ref) => (
  <DatePickerTrigger type="button" onClick={onClick} ref={ref} hasError={hasError}>
    <span style={{ color: value ? "#070b35" : "#b5bcc7" }}>{value || "dd.mm.yyyy"}</span>
    <CalendarIcon />
  </DatePickerTrigger>
));
DatePickerCustomInput.displayName = "DatePickerCustomInput";

type SelectProps<T extends string> = Readonly<{
  value: T | "";
  onChange: (val: T) => void;
  options: readonly { value: T; label: string }[];
  placeholder: string;
  hasError?: boolean;
}>;

function CustomSelect<T extends string>({
  value,
  onChange,
  options,
  placeholder,
  hasError,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <SelectWrapper ref={ref}>
      <SelectTrigger type="button" onClick={() => setOpen((o) => !o)} hasError={hasError}>
        {selectedLabel ? <span>{selectedLabel}</span> : <SelectPlaceholder>{placeholder}</SelectPlaceholder>}
        <ChevronDown open={open} />
      </SelectTrigger>
      {open && (
        <SelectDropdown>
          {options.map((opt) => (
            <SelectOption
              key={opt.value}
              type="button"
              selected={opt.value === value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </SelectOption>
          ))}
        </SelectDropdown>
      )}
    </SelectWrapper>
  );
}

interface TaskForm {
  title: string;
  projectName: string;
  description: string;
  type: TaskCategoryVariant | "";
  priority: TaskDifficultyVariant | "";
  deadline: Date | null;
  notes: string;
}

interface FormErrors {
  title?: string;
  projectName?: string;
  type?: string;
  priority?: string;
  deadline?: string;
}

const INITIAL_FORM: TaskForm = {
  title: "",
  projectName: "",
  description: "",
  type: "",
  priority: "",
  deadline: null,
  notes: "",
};

const TYPE_OPTIONS: { value: TaskCategoryVariant; label: string }[] = [
  { value: "airdrop", label: "Airdrop" },
  { value: "testnet", label: "Testnet" },
  { value: "quest", label: "Quest" },
  { value: "node", label: "Node" },
  { value: "other", label: "Others" },
];

const PRIORITY_OPTIONS: { value: TaskDifficultyVariant; label: string }[] = [
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "high", label: "High" },
];

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

interface AddTaskModalProps {
  isOpen: boolean;
  columnId: TaskStatus;
  onClose: () => void;
  onAdd: (task: BoardTask) => void;
}

export const AddTaskModal: FC<AddTaskModalProps> = ({ isOpen, columnId, onClose, onAdd }) => {
  const { translateText } = useTranslation();
  const [form, setForm] = useState<TaskForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (isOpen) {
      setForm(INITIAL_FORM);
      setErrors({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const setField = <K extends keyof TaskForm>(key: K, value: TaskForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key in errors && errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.title.trim()) newErrors.title = translateText("Please enter a task title");
    if (!form.projectName.trim()) newErrors.projectName = translateText("Project name is required");
    if (!form.type) newErrors.type = translateText("Please select a type");
    if (!form.priority) newErrors.priority = translateText("Please select a priority");
    if (!form.deadline) newErrors.deadline = translateText("Select deadline date");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const newTask: BoardTask = {
      id: `task-${Date.now()}`,
      projectName: form.title,
      projectPlatform: form.projectName,
      category: form.type as TaskCategoryVariant,
      difficulty: form.priority as TaskDifficultyVariant,
      status: columnId,
      scheduledDate: form.deadline ? formatLocalDate(form.deadline) : undefined,
      description: form.description || undefined,
      notes: form.notes || undefined,
    };

    onAdd(newTask);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <>
      <DatePickerGlobalStyles />
      <Overlay onClick={handleOverlayClick}>
        <ModalWrapper>
          <ModalHeader>
            <ModalTitle>{translateText("Add New Task")}</ModalTitle>
            <CloseButton type="button" onClick={onClose}>
              <XIcon />
            </CloseButton>
          </ModalHeader>

          <FormBody>
            <FormRow>
              <FormField>
                <FieldLabel>{translateText("Task Title")}</FieldLabel>
                <FieldInput
                  placeholder={translateText("e.g. zkSync Bridge")}
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  hasError={!!errors.title}
                />
                {errors.title && <FieldError>{errors.title}</FieldError>}
              </FormField>
              <FormField>
                <FieldLabel>{translateText("Project Name")}</FieldLabel>
                <FieldInput
                  placeholder={translateText("e.g. zkSync")}
                  value={form.projectName}
                  onChange={(e) => setField("projectName", e.target.value)}
                  hasError={!!errors.projectName}
                />
                {errors.projectName && <FieldError>{errors.projectName}</FieldError>}
              </FormField>
            </FormRow>

            <FormField>
              <FieldLabel>{translateText("Description")}</FieldLabel>
              <FieldTextarea
                placeholder={translateText("Describe what needs to be done (optional)")}
                value={form.description}
                onChange={(e) => setField("description", e.target.value.slice(0, 300))}
              />
              <DescHint>{translateText("Max 300 characters")}</DescHint>
            </FormField>

            <FormRow>
              <FormField>
                <FieldLabel>{translateText("Type")}</FieldLabel>
                <CustomSelect<TaskCategoryVariant>
                  value={form.type}
                  onChange={(v) => setField("type", v)}
                  options={TYPE_OPTIONS.map((option) => ({
                    ...option,
                    label: translateText(option.label),
                  }))}
                  placeholder={translateText("Select type")}
                  hasError={!!errors.type}
                />
                {errors.type && <FieldError>{errors.type}</FieldError>}
              </FormField>
              <FormField>
                <FieldLabel>{translateText("Priority")}</FieldLabel>
                <CustomSelect<TaskDifficultyVariant>
                  value={form.priority}
                  onChange={(v) => setField("priority", v)}
                  options={PRIORITY_OPTIONS.map((option) => ({
                    ...option,
                    label: translateText(option.label),
                  }))}
                  placeholder={translateText("Select priority")}
                  hasError={!!errors.priority}
                />
                {errors.priority && <FieldError>{errors.priority}</FieldError>}
              </FormField>
            </FormRow>

            <FormField>
              <FieldLabel>{translateText("Deadline")}</FieldLabel>
              <DatePicker
                selected={form.deadline}
                onChange={(date: Date | null) => setField("deadline", date)}
                dateFormat="dd.MM.yyyy"
                minDate={new Date()}
                placeholderText="dd.mm.yyyy"
                popperPlacement="bottom-start"
                customInput={
                  <DatePickerCustomInput hasError={!!errors.deadline} />
                }
              />
              {errors.deadline && <FieldError>{errors.deadline}</FieldError>}
            </FormField>

            <FormField>
              <FieldLabel>{translateText("Notes")}</FieldLabel>
              <FieldTextarea
                placeholder={translateText("Personal notes, reminders, wallet used...")}
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
              />
            </FormField>
          </FormBody>

          <ModalFooter>
            <CancelButton type="button" onClick={onClose}>
              {translateText("Cancel")}
            </CancelButton>
            <AddButton type="button" onClick={handleSubmit}>
              {translateText("Add Task")}
            </AddButton>
          </ModalFooter>
        </ModalWrapper>
      </Overlay>
    </>
  );
};
