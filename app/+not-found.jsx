import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>404</Text>
      <Text style={styles.subtitle}>Page not found</Text>
      <Link href="/" style={styles.link}>
        Go back home
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    gap: 16,
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#FF5C4D',
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#666666',
  },
  link: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FF5C4D',
    fontWeight: '600',
    marginTop: 16,
  },
});
