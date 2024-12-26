import React from 'react';
import styled from 'styled-components/native';
import { Icon } from './icon';

const Root = styled.TouchableOpacity`
    flex-direction: row;
`;

export const IconButton = props => {
    const {
        text,
        iconName,
        isDisabled,
        onPress,
        ...buttonProps
    } = props;
    const iconProps = {
        text,
        iconName,
        isDisabled
    };

    return (
        <Root
            {...buttonProps}
            activeOpacity={isDisabled ? 1 : 0.2}
            isDisabled={isDisabled}
            onPress={isDisabled ? undefined : onPress}
        >
            <Icon {...iconProps} />
        </Root>
    );
};
