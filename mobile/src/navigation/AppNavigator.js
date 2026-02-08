import { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { hasAcceptedTerms, saveTermsAcceptance } from '../utils/storage';

// Screens
import SplashScreen from '../components/SplashScreen';
import TermsAcceptanceScreen from '../screens/TermsAcceptanceScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/TermsOfServiceScreen';
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
    const [splashFinished, setSplashFinished] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [checkingTerms, setCheckingTerms] = useState(true);

    useEffect(() => {
        checkTermsAcceptance();
    }, []);

    const checkTermsAcceptance = async () => {
        try {
            const accepted = await hasAcceptedTerms();
            setTermsAccepted(accepted);
        } catch (error) {
            console.error('Error checking terms acceptance:', error);
        } finally {
            setCheckingTerms(false);
        }
    };

    const handleTermsAccept = async () => {
        const success = await saveTermsAcceptance();
        if (success) {
            setTermsAccepted(true);
        }
    };

    if (loading || !splashFinished || checkingTerms) {
        return <SplashScreen onFinish={() => setSplashFinished(true)} />;
    }

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            {!termsAccepted ? (
                <>
                    <Stack.Screen name="TermsAcceptance">
                        {(props) => <TermsAcceptanceScreen {...props} onAccept={handleTermsAccept} />}
                    </Stack.Screen>
                    <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
                    <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
                </>
            ) : !isAuthenticated ? (
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
    );
}
