import React from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import styled from 'styled-components/native';
import {
    useTheme,
    Text
} from 'react-native-paper';

const Root = styled.View`
    min-height: 80px;
    width: 80px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-vertical: 8px;
    ${({ isDisabled }) => isDisabled && `
        opacity: 0.5;
    `}
`;

const Label = styled(Text)`
    padding-top: 5px;
    color: ${({ theme }) => theme.colors.onPrimary};
    text-align: center;
`;

export const Icon = ({
    isDisabled = false,
    iconName,
    text
}) => {
    const theme = useTheme();
    return (
        <Root isDisabled={isDisabled}>
            <MaterialCommunityIcons
                name={iconName}
                size={26}
                color={theme.colors.onPrimary}
            />
            <Label>
                {text}
            </Label>
        </Root>
    );
};
