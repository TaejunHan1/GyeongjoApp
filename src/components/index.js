// src/components/index.js - 공통 컴포넌트들
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Sizes, Typography } from '../styles/constants';

const { width } = Dimensions.get('window');

// ===================================
// 버튼 컴포넌트들
// ===================================

/**
 * 기본 버튼 컴포넌트
 */
export const Button = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary', // primary, secondary, outline, text
  size = 'large', // small, medium, large
  fullWidth = true,
  icon,
  iconPosition = 'left', // left, right
  style,
  textStyle,
  ...props
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button];
    
    // 크기별 스타일
    switch (size) {
      case 'small':
        baseStyle.push(styles.buttonSmall);
        break;
      case 'medium':
        baseStyle.push(styles.buttonMedium);
        break;
      case 'large':
        baseStyle.push(styles.buttonLarge);
        break;
    }
    
    // 변형별 스타일
    switch (variant) {
      case 'primary':
        baseStyle.push(styles.buttonPrimary);
        break;
      case 'secondary':
        baseStyle.push(styles.buttonSecondary);
        break;
      case 'outline':
        baseStyle.push(styles.buttonOutline);
        break;
      case 'text':
        baseStyle.push(styles.buttonText);
        break;
    }
    
    // 전체 너비
    if (fullWidth) {
      baseStyle.push(styles.buttonFullWidth);
    }
    
    // 비활성화 상태
    if (disabled || loading) {
      baseStyle.push(styles.buttonDisabled);
    }
    
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.buttonText];
    
    // 크기별 텍스트 스타일
    switch (size) {
      case 'small':
        baseStyle.push(styles.buttonTextSmall);
        break;
      case 'medium':
        baseStyle.push(styles.buttonTextMedium);
        break;
      case 'large':
        baseStyle.push(styles.buttonTextLarge);
        break;
    }
    
    // 변형별 텍스트 색상
    switch (variant) {
      case 'primary':
        baseStyle.push(styles.buttonTextPrimary);
        break;
      case 'secondary':
        baseStyle.push(styles.buttonTextSecondary);
        break;
      case 'outline':
        baseStyle.push(styles.buttonTextOutline);
        break;
      case 'text':
        baseStyle.push(styles.buttonTextOnly);
        break;
    }
    
    return baseStyle;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          color={variant === 'primary' ? Colors.white : Colors.primary}
          size="small"
        />
      );
    }

    const textElement = (
      <Text style={[getTextStyle(), textStyle]}>
        {title}
      </Text>
    );

    if (!icon) {
      return textElement;
    }

    const iconElement = (
      <Ionicons
        name={icon}
        size={size === 'small' ? 16 : size === 'medium' ? 18 : 20}
        color={variant === 'primary' ? Colors.white : Colors.primary}
        style={{ marginHorizontal: 4 }}
      />
    );

    return (
      <View style={styles.buttonContent}>
        {iconPosition === 'left' && iconElement}
        {textElement}
        {iconPosition === 'right' && iconElement}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

/**
 * 아이콘 버튼 컴포넌트
 */
export const IconButton = ({
  icon,
  onPress,
  size = 'medium', // small, medium, large
  variant = 'default', // default, primary, secondary
  disabled = false,
  style,
  ...props
}) => {
  const getButtonSize = () => {
    switch (size) {
      case 'small': return 32;
      case 'medium': return 40;
      case 'large': return 48;
      default: return 40;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small': return 16;
      case 'medium': return 20;
      case 'large': return 24;
      default: return 20;
    }
  };

  const getButtonStyle = () => {
    const buttonSize = getButtonSize();
    const baseStyle = {
      width: buttonSize,
      height: buttonSize,
      borderRadius: buttonSize / 2,
      justifyContent: 'center',
      alignItems: 'center',
    };

    switch (variant) {
      case 'primary':
        return { ...baseStyle, backgroundColor: Colors.primary };
      case 'secondary':
        return { ...baseStyle, backgroundColor: Colors.gray100 };
      default:
        return { ...baseStyle, backgroundColor: Colors.gray50 };
    }
  };

  const getIconColor = () => {
    if (disabled) return Colors.gray400;
    
    switch (variant) {
      case 'primary': return Colors.white;
      case 'secondary': return Colors.textPrimary;
      default: return Colors.textSecondary;
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), disabled && { opacity: 0.5 }, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      {...props}
    >
      <Ionicons
        name={icon}
        size={getIconSize()}
        color={getIconColor()}
      />
    </TouchableOpacity>
  );
};

// ===================================
// 입력 컴포넌트들
// ===================================

/**
 * 향상된 텍스트 입력 컴포넌트
 */
export const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  maxLength,
  editable = true,
  style,
  inputStyle,
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!secureTextEntry);

  const getInputContainerStyle = () => {
    const baseStyle = [styles.inputContainer];
    
    if (focused) {
      baseStyle.push(styles.inputContainerFocused);
    }
    
    if (error) {
      baseStyle.push(styles.inputContainerError);
    }
    
    if (!editable) {
      baseStyle.push(styles.inputContainerDisabled);
    }
    
    return baseStyle;
  };

  const handleRightIconPress = () => {
    if (secureTextEntry) {
      setShowPassword(!showPassword);
    } else if (onRightIconPress) {
      onRightIconPress();
    }
  };

  const getRightIcon = () => {
    if (secureTextEntry) {
      return showPassword ? 'eye-off-outline' : 'eye-outline';
    }
    return rightIcon;
  };

  return (
    <View style={[styles.inputWrapper, style]}>
      {label && (
        <Text style={styles.inputLabel}>{label}</Text>
      )}
      
      <View style={getInputContainerStyle()}>
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={focused ? Colors.primary : Colors.gray400}
            style={styles.inputLeftIcon}
          />
        )}
        
        <TextInput
          style={[styles.inputField, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.gray400}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        
        {getRightIcon() && (
          <TouchableOpacity
            onPress={handleRightIconPress}
            style={styles.inputRightIcon}
          >
            <Ionicons
              name={getRightIcon()}
              size={20}
              color={focused ? Colors.primary : Colors.gray400}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {(error || helperText) && (
        <Text style={[styles.inputHelperText, error && styles.inputErrorText]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

/**
 * 검색 입력 컴포넌트
 */
export const SearchInput = ({
  value,
  onChangeText,
  placeholder = '검색',
  onClear,
  style,
  ...props
}) => {
  const handleClear = () => {
    onChangeText('');
    if (onClear) onClear();
  };

  return (
    <View style={[styles.searchContainer, style]}>
      <Ionicons
        name="search-outline"
        size={20}
        color={Colors.gray400}
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.searchInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.gray400}
        {...props}
      />
      {value ? (
        <TouchableOpacity onPress={handleClear} style={styles.searchClear}>
          <Ionicons
            name="close-circle"
            size={20}
            color={Colors.gray400}
          />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

// ===================================
// 카드 컴포넌트들
// ===================================

/**
 * 기본 카드 컴포넌트
 */
export const Card = ({
  children,
  onPress,
  style,
  contentStyle,
  shadow = true,
  padding = true,
  ...props
}) => {
  const getCardStyle = () => {
    const baseStyle = [styles.card];
    
    if (shadow) {
      baseStyle.push(styles.cardShadow);
    }
    
    if (!padding) {
      baseStyle.push(styles.cardNoPadding);
    }
    
    return baseStyle;
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={[getCardStyle(), style]}
        onPress={onPress}
        activeOpacity={0.95}
        {...props}
      >
        <View style={contentStyle}>
          {children}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[getCardStyle(), style]} {...props}>
      <View style={contentStyle}>
        {children}
      </View>
    </View>
  );
};

// ===================================
// 배지 및 태그 컴포넌트들
// ===================================

/**
 * 배지 컴포넌트
 */
export const Badge = ({
  text,
  variant = 'primary', // primary, secondary, success, warning, error
  size = 'medium', // small, medium, large
  style,
  textStyle,
}) => {
  const getBadgeStyle = () => {
    const baseStyle = [styles.badge];
    
    // 크기별 스타일
    switch (size) {
      case 'small':
        baseStyle.push(styles.badgeSmall);
        break;
      case 'medium':
        baseStyle.push(styles.badgeMedium);
        break;
      case 'large':
        baseStyle.push(styles.badgeLarge);
        break;
    }
    
    // 변형별 스타일
    switch (variant) {
      case 'primary':
        baseStyle.push(styles.badgePrimary);
        break;
      case 'secondary':
        baseStyle.push(styles.badgeSecondary);
        break;
      case 'success':
        baseStyle.push(styles.badgeSuccess);
        break;
      case 'warning':
        baseStyle.push(styles.badgeWarning);
        break;
      case 'error':
        baseStyle.push(styles.badgeError);
        break;
    }
    
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.badgeText];
    
    switch (size) {
      case 'small':
        baseStyle.push(styles.badgeTextSmall);
        break;
      case 'medium':
        baseStyle.push(styles.badgeTextMedium);
        break;
      case 'large':
        baseStyle.push(styles.badgeTextLarge);
        break;
    }
    
    return baseStyle;
  };

  return (
    <View style={[getBadgeStyle(), style]}>
      <Text style={[getTextStyle(), textStyle]}>
        {text}
      </Text>
    </View>
  );
};

// ===================================
// 로딩 컴포넌트들
// ===================================

/**
 * 로딩 스피너 컴포넌트
 */
export const LoadingSpinner = ({
  size = 'large',
  color = Colors.primary,
  text,
  style,
}) => {
  return (
    <View style={[styles.loadingContainer, style]}>
      <ActivityIndicator size={size} color={color} />
      {text && (
        <Text style={styles.loadingText}>{text}</Text>
      )}
    </View>
  );
};

/**
 * 풀스크린 로딩 컴포넌트
 */
export const FullScreenLoading = ({
  text = '로딩 중...',
  color = Colors.primary,
}) => {
  return (
    <View style={styles.fullScreenLoading}>
      <ActivityIndicator size="large" color={color} />
      <Text style={styles.fullScreenLoadingText}>{text}</Text>
    </View>
  );
};

// ===================================
// 구분선 컴포넌트
// ===================================

/**
 * 구분선 컴포넌트
 */
export const Divider = ({
  horizontal = true,
  thickness = 1,
  color = Colors.gray200,
  margin = 0,
  style,
}) => {
  const dividerStyle = {
    backgroundColor: color,
    ...(horizontal
      ? { height: thickness, marginVertical: margin }
      : { width: thickness, marginHorizontal: margin }),
  };

  return <View style={[dividerStyle, style]} />;
};

// ===================================
// 애니메이션 컴포넌트들
// ===================================

/**
 * 페이드 인/아웃 컴포넌트
 */
export const FadeView = ({
  children,
  visible = true,
  duration = 300,
  style,
}) => {
  const fadeAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration,
      useNativeDriver: true,
    }).start();
  }, [visible, duration]);

  return (
    <Animated.View style={[{ opacity: fadeAnim }, style]}>
      {children}
    </Animated.View>
  );
};

/**
 * 슬라이드 인/아웃 컴포넌트
 */
export const SlideView = ({
  children,
  visible = true,
  direction = 'up', // up, down, left, right
  duration = 300,
  style,
}) => {
  const slideAnim = useRef(new Animated.Value(visible ? 0 : 100)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : 100,
      duration,
      useNativeDriver: true,
    }).start();
  }, [visible, duration]);

  const getTransform = () => {
    switch (direction) {
      case 'up':
        return [{ translateY: slideAnim }];
      case 'down':
        return [{ translateY: slideAnim.interpolate({
          inputRange: [0, 100],
          outputRange: [0, -100],
        }) }];
      case 'left':
        return [{ translateX: slideAnim.interpolate({
          inputRange: [0, 100],
          outputRange: [0, -100],
        }) }];
      case 'right':
        return [{ translateX: slideAnim }];
      default:
        return [{ translateY: slideAnim }];
    }
  };

  return (
    <Animated.View style={[{ transform: getTransform() }, style]}>
      {children}
    </Animated.View>
  );
};

// ===================================
// 스타일 정의
// ===================================

const styles = StyleSheet.create({
  // 버튼 스타일
  button: {
    borderRadius: Sizes.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonSmall: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 32,
  },
  buttonMedium: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 40,
  },
  buttonLarge: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    minHeight: 48,
  },
  buttonPrimary: {
    backgroundColor: Colors.primary,
  },
  buttonSecondary: {
    backgroundColor: Colors.gray100,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  buttonText: {
    backgroundColor: 'transparent',
  },
  buttonFullWidth: {
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // 버튼 텍스트 스타일
  buttonTextSmall: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  buttonTextMedium: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
  },
  buttonTextLarge: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
  },
  buttonTextPrimary: {
    color: Colors.white,
  },
  buttonTextSecondary: {
    color: Colors.textPrimary,
  },
  buttonTextOutline: {
    color: Colors.primary,
  },
  buttonTextOnly: {
    color: Colors.primary,
  },
  
  // 입력 필드 스타일
  inputWrapper: {
    marginBottom: Sizes.margin.lg,
  },
  inputLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Sizes.margin.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    borderRadius: Sizes.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.gray200,
    paddingHorizontal: Sizes.padding.lg,
  },
  inputContainerFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  inputContainerError: {
    borderColor: Colors.error,
  },
  inputContainerDisabled: {
    backgroundColor: Colors.gray100,
    opacity: 0.6,
  },
  inputField: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
    paddingVertical: Sizes.padding.lg,
  },
  inputLeftIcon: {
    marginRight: Sizes.margin.sm,
  },
  inputRightIcon: {
    marginLeft: Sizes.margin.sm,
    padding: 4,
  },
  inputHelperText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Sizes.margin.xs,
  },
  inputErrorText: {
    color: Colors.error,
  },
  
  // 검색 입력 스타일
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    borderRadius: Sizes.borderRadius.lg,
    paddingHorizontal: Sizes.padding.lg,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  searchIcon: {
    marginRight: Sizes.margin.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
    paddingVertical: Sizes.padding.lg,
  },
  searchClear: {
    marginLeft: Sizes.margin.sm,
    padding: 4,
  },
  
  // 카드 스타일
  card: {
    backgroundColor: Colors.white,
    borderRadius: Sizes.borderRadius.lg,
    padding: Sizes.padding.xl,
  },
  cardShadow: {
    ...Sizes.shadow.medium,
  },
  cardNoPadding: {
    padding: 0,
  },
  
  // 배지 스타일
  badge: {
    borderRadius: Sizes.borderRadius.md,
    paddingHorizontal: Sizes.padding.sm,
    paddingVertical: Sizes.padding.xs,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeMedium: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeLarge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgePrimary: {
    backgroundColor: Colors.primary,
  },
  badgeSecondary: {
    backgroundColor: Colors.gray200,
  },
  badgeSuccess: {
    backgroundColor: Colors.success,
  },
  badgeWarning: {
    backgroundColor: Colors.warning,
  },
  badgeError: {
    backgroundColor: Colors.error,
  },
  badgeText: {
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
  },
  badgeTextSmall: {
    fontSize: Typography.fontSize.xs,
  },
  badgeTextMedium: {
    fontSize: Typography.fontSize.sm,
  },
  badgeTextLarge: {
    fontSize: Typography.fontSize.md,
  },
  
  // 로딩 스타일
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Sizes.padding.xl,
  },
  loadingText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginTop: Sizes.margin.sm,
  },
  fullScreenLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000,
  },
  fullScreenLoadingText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
    marginTop: Sizes.margin.lg,
    fontWeight: Typography.fontWeight.medium,
  },
});

// 모든 컴포넌트 export
export default {
  Button,
  IconButton,
  Input,
  SearchInput,
  Card,
  Badge,
  LoadingSpinner,
  FullScreenLoading,
  Divider,
  FadeView,
  SlideView,
};