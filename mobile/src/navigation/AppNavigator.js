import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

// Screens
import LoginScreen from '../screens/LoginScreen';
import ConnectGmailScreen from '../screens/ConnectGmailScreen';
import DashboardScreen from '../screens/DashboardScreen';
import EmailListScreen from '../screens/EmailListScreen';
import EmailDetailScreen from '../screens/EmailDetailScreen';
import TaskListScreen from '../screens/TaskListScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        // Loading state while checking auth
        return null;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                }}
            >
                {!isAuthenticated ? (
                    <Stack.Screen name="Login" component={LoginScreen} />
                ) : (
                    <>
                        <Stack.Screen name="Dashboard" component={DashboardScreen} />
                        <Stack.Screen name="ConnectGmail" component={ConnectGmailScreen} />
                        <Stack.Screen name="Emails" component={EmailListScreen} />
                        <Stack.Screen name="EmailDetail" component={EmailDetailScreen} />
                        <Stack.Screen name="Tasks" component={TaskListScreen} />
                        <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
                        <Stack.Screen name="Profile" component={ProfileScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
