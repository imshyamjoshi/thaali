import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useAppStore } from '@/store/useAppStore';

export default function AuthScreen() {
  const [loading, setLoading] = useState(false);
  const setUserId = useAppStore((s) => s.setUserId);

  async function handleGuestLogin() {
    router.replace('/');
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: 'thaali://auth-callback' },
      });
      if (error) throw error;
    } catch (e) {
      console.error('Google sign-in error:', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 px-6 items-center justify-center">
        {/* App logo / branding */}
        <Text className="text-6xl mb-4">🥘</Text>
        <Text className="text-3xl font-bold text-gray-800 mb-2">Thaali</Text>
        <Text className="text-base text-muted text-center mb-12 px-4">
          Track your macros the Indian way — no guesswork, no Western food bias.
        </Text>

        {/* Sign in options */}
        <View className="w-full gap-3">
          <TouchableOpacity
            className="bg-white border border-gray-200 rounded-2xl py-4 flex-row items-center justify-center gap-3 shadow-sm"
            onPress={handleGoogleSignIn}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#E85D04" />
            ) : (
              <>
                <Text className="text-xl">🔵</Text>
                <Text className="font-semibold text-gray-700">Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-white border border-gray-200 rounded-2xl py-4 flex-row items-center justify-center gap-3 shadow-sm"
            onPress={handleGuestLogin}
            activeOpacity={0.8}
          >
            <Text className="text-xl">👤</Text>
            <Text className="font-semibold text-gray-700">Continue as Guest</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-xs text-muted text-center mt-8 px-8">
          Guest mode stores data on this device only.{'\n'}Sign in to sync across devices.
        </Text>
      </View>
    </SafeAreaView>
  );
}
