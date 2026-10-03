import { Text, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tabs, usePathname } from 'expo-router';
import { useTheme, bottomNavigationHeight } from 'mobile-tokens';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  const { colors } = useTheme();
  const { fontScale, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const path = usePathname();
  const editing =
    path.endsWith('/builder') ||
    path.endsWith('/add') ||
    /^\/(feedback|customers)\/[^/]+$/.test(path);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarAllowFontScaling: true,
        tabBarLabel: ({ children, color }) => (
          <Text
            numberOfLines={2}
            style={{
              fontSize: 12,
              fontWeight: '600',
              letterSpacing: -0.1,
              textAlign: 'center',
              color,
              marginTop: 3,
              // Allow the full item width despite the navigator's inner padding.
              width: width / 5,
              maxWidth: width / 5,
            }}
          >
            {children}
          </Text>
        ),
        tabBarItemStyle: { minHeight: 48 },
        tabBarActiveTintColor: colors.violet,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          display: editing ? 'none' : 'flex',
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: bottomNavigationHeight(fontScale) + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 8),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={22}
              color={color}
            />
          ),
          tabBarAccessibilityLabel: 'Home tab',
        }}
      />
      <Tabs.Screen
        name="feedback"
        options={{
          title: 'Feedback',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'chatbubble' : 'chatbubble-outline'}
              size={22}
              color={color}
            />
          ),
          tabBarAccessibilityLabel: 'Feedback inbox tab',
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: 'Customers',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'people' : 'people-outline'}
              size={22}
              color={color}
            />
          ),
          tabBarAccessibilityLabel: 'Customers tab',
        }}
      />
      <Tabs.Screen
        name="campaigns"
        options={{
          title: 'Campaigns',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'megaphone' : 'megaphone-outline'}
              size={22}
              color={color}
            />
          ),
          tabBarAccessibilityLabel: 'Campaigns tab',
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color }) => (
            <Ionicons name="ellipsis-horizontal" size={22} color={color} />
          ),
          tabBarAccessibilityLabel: 'More tab',
        }}
      />
    </Tabs>
  );
}
