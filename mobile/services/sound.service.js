import { Audio } from 'expo-av';

let currentSound = null;

export const playPreview = async (previewUrl) => {
  try {
    // 1. Arrêter le son précédent s'il y en a un
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      currentSound = null;
    }

    if (!previewUrl) {
      return null;
    }

    // 2. Configurer le mode audio (Important pour iOS)
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    // 3. Charger et jouer
    const { sound } = await Audio.Sound.createAsync(
      { uri: previewUrl },
      { shouldPlay: true }
    );

    currentSound = sound;
    return sound;

  } catch (error) {
    console.error('❌ Erreur audio:', error);
    return null;
  }
};

export const stopSound = async () => {
  try {
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      currentSound = null;
    }
  } catch (error) {
    console.error('❌ Erreur stop audio:', error);
  }
};