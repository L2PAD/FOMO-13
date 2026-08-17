import React from 'react'
import styled, { css } from 'styled-components'

const HighlightedTextWrapper = styled.span`
    && {
        display: inline;
        margin-top: 0;
        white-space: inherit;
    }

    font-size: inherit;
    color: inherit !important;
    font-weight: inherit;
    line-height: inherit;
`

const HighlightedPart = styled.span<{ $variant: HighlightVariant }>`
    && {
        display: inline;
        margin-top: 0;
        white-space: inherit;
    }

    ${({ $variant }) =>
        $variant === "news"
            ? css`
                  color: inherit !important;
                  font-weight: inherit;
                  background-color: rgba(4, 165, 132, 0.18) !important;
                  padding: 0 2px;
                  border-radius: 4px;
              `
            : css`
                  color: var(--main-green) !important;
                  font-weight: var(--font-weight-semibold);
                  background-color: rgba(130, 130, 130, 0.153) !important;
                  padding: 0 1px;
                  border-radius: 2px;
              `}
`

type HighlightVariant = "default" | "news";

interface HighlightedTextProps {
    text: string
    searchValue: string
    highlightAll?: boolean
    caseSensitive?: boolean
    highlightVariant?: HighlightVariant
}

const HighlightedText: React.FC<HighlightedTextProps> = ({
    text,
    searchValue,
    highlightAll = false,
    caseSensitive = false,
    highlightVariant = "default"
}) => {
    const normalizedSearchValue = searchValue.trim()

    if (!normalizedSearchValue) {
        return <HighlightedTextWrapper>{text}</HighlightedTextWrapper>
    }

    const searchStr = caseSensitive
        ? normalizedSearchValue
        : normalizedSearchValue.toLowerCase()
    const textStr = caseSensitive ? text : text.toLowerCase()

    if (highlightAll) {
        const parts = []
        let lastIndex = 0
        let matchIndex

        while ((matchIndex = textStr.indexOf(searchStr, lastIndex)) !== -1) {
            if (matchIndex > lastIndex) {
                parts.push(
                    <React.Fragment key={`before-${matchIndex}`}>
                        {text.substring(lastIndex, matchIndex)}
                    </React.Fragment>
                )
            }

            parts.push(
                <HighlightedPart key={`match-${matchIndex}`} $variant={highlightVariant}>
                    {text.substring(matchIndex, matchIndex + normalizedSearchValue.length)}
                </HighlightedPart>
            )

            lastIndex = matchIndex + normalizedSearchValue.length
        }

        if (lastIndex < text.length) {
            parts.push(
                <React.Fragment key="after">
                    {text.substring(lastIndex)}
                </React.Fragment>
            )
        }

        return <HighlightedTextWrapper>{parts}</HighlightedTextWrapper>
    } else {
        const matchIndex = textStr.indexOf(searchStr)

        if (matchIndex === -1) {
            return <HighlightedTextWrapper>{text}</HighlightedTextWrapper>
        }

        const beforeMatch = text.substring(0, matchIndex)
        const matched = text.substring(matchIndex, matchIndex + normalizedSearchValue.length)
        const afterMatch = text.substring(matchIndex + normalizedSearchValue.length)

        return (
            <HighlightedTextWrapper>
                {beforeMatch}
                <HighlightedPart $variant={highlightVariant}>{matched}</HighlightedPart>
                {afterMatch}
            </HighlightedTextWrapper>
        )
    }
}

export default HighlightedText
