import styled from 'styled-components';

export const PickerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const PickerLabel = styled.p`
  color: var(--color-text-primary);
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
`;

export const SearchInput = styled.input`
  width: 100%;
  height: 40px;
  border: 1px solid rgba(83, 98, 124, 0.16);
  border-radius: 8px;
  padding: 0 12px;
  color: var(--color-text-primary);
  outline: none;

  &:focus { border-color: var(--color-primary); }
`;

export const ActivitySelect = styled.select`
  width: 100%;
  min-height: 42px;
  border: 1px solid rgba(83, 98, 124, 0.16);
  border-radius: 8px;
  padding: 0 10px;
  background: var(--color-white);
  color: var(--color-text-primary);
  outline: none;

  &:focus { border-color: var(--color-primary); }
`;

export const ActivityPreview = styled.div`
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 10px;
  border: 1px solid rgba(83, 98, 124, 0.10);
  border-radius: 8px;
  background: rgba(83, 98, 124, 0.025);
`;

export const ActivityLogo = styled.div`
  width: 42px;
  height: 42px;
  overflow: hidden;
  border-radius: 50%;
  background: rgba(83, 98, 124, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  font-weight: var(--font-weight-semibold);

  img { width: 100%; height: 100%; object-fit: cover; }
`;

export const ActivityName = styled.p`
  overflow: hidden;
  color: var(--color-text-primary);
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ActivityMeta = styled.p`
  margin-top: 3px;
  color: var(--color-text-muted);
  font-size: 11px;
`;

export const ActivityBadge = styled.span<{ $prime?: boolean }>`
  border-radius: 999px;
  padding: 5px 8px;
  color: ${({ $prime }) => ($prime ? '#8a6500' : '#027e66')};
  background: ${({ $prime }) =>
    $prime ? 'rgba(255, 199, 4, 0.18)' : 'rgba(4, 165, 132, 0.11)'};
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  text-transform: capitalize;
`;

export const PickerMessage = styled.p<{ $error?: boolean }>`
  color: ${({ $error }) => ($error ? '#c43249' : 'var(--color-text-muted)')};
  font-size: 12px;
`;
