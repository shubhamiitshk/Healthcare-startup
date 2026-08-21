import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    StyleSheet,
    Dimensions,
    Image,
    Pressable,
    StatusBar,
} from 'react-native';
import { MapPin, ArrowLeft } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDoctors } from '../src/store/doctorsSlice'; // Import the API call from Redux
import debounce from 'lodash.debounce';
// Install and import any shimmer library you prefer, for example:
import LinearGradient from 'react-native-linear-gradient';
import {createShimmerPlaceholder} from 'react-native-shimmer-placeholder';
import { SafeAreaView } from 'react-native-safe-area-context';
const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

const { width } = Dimensions.get('window');

const ItemSeparator = () => <View style={styles.divider} />;

const SearchResultItem = ({ item, searchQuery, navigation }) => {
    const [, setImageError] = useState(false);

    const highlightText = (text, query, baseStyle) => {
        if (!query) {return <Text style={baseStyle}>{text}</Text>;}
        const regex = new RegExp(`^(${escapeRegExp(query)})`, 'i');
        const match = text.match(regex);
        if (match) {
            const matchedPart = match[1];
            const remainingPart = text.slice(matchedPart.length);
            return (
                <Text style={baseStyle}>
                    <Text style={styles.highlight}>{matchedPart}</Text>
                    {remainingPart}
                </Text>
            );
        }
        return <Text style={baseStyle}>{text}</Text>;
    };

    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    return (
        <Pressable
            style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
            ]}
            onPress={() => {
                navigation.navigate('DoctorProfile', { doctor: item }); // Pass the item directly
            }}
        >
            <Image
                source={
                   require('../assets/Avatar.png') // Fallback image
                }
                style={styles.profileImage}
                resizeMode="cover"
                onError={() => setImageError(true)}
            />
            <View style={styles.cardContent}>
                <Text style={styles.itemName}>
                    <Text>Dr. </Text>
                    {highlightText(item.name, searchQuery, styles.itemName)}
                </Text>
                <View style={styles.content}>
                    {item.specialization && (
                        <Text style={styles.specialization}>
                            {highlightText(item.specialization, searchQuery, styles.specialization)}
                        </Text>
                    )}
                    {/* <View style={styles.circle} />
                    <Text style={styles.address}>
                        {item.address || 'No Address Available'}
                    </Text> */}
                </View>
            </View>
        </Pressable>
    );
};

const SearchScreen = ({ route, navigation }) => {
    const { searchQuery: initialQuery = '', shouldFocusInput = false } = route.params || {};
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [filteredResults, setFilteredResults] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // Loading state

    const dispatch = useDispatch();
    const { doctors } = useSelector((state) => state.doctors);

    useEffect(() => {
        dispatch(fetchDoctors()); // Fetch doctors from backend when the screen loads
    }, [dispatch]);

    useEffect(() => {
        // Simulate fetch
        setTimeout(() => setIsLoading(false), 1200);
    }, []);

    useEffect(() => {
        if (initialQuery) {
            performSearch(initialQuery);
        } else {
            setFilteredResults([]);
        }
    }, [initialQuery, performSearch]);

    const performSearch = useMemo(
        () =>
            debounce((query) => {
                if (!query) {
                    setFilteredResults([]);
                    return;
                }

                const lowerCaseQuery = query.toLowerCase();

                const results = doctors.filter((doctor) => {
                    return (
                        doctor.name.toLowerCase().includes(lowerCaseQuery) ||
                        (doctor.specialization &&
                            doctor.specialization.toLowerCase().includes(lowerCaseQuery))
                    );
                });

                setFilteredResults(results);
            }, 300), // 300ms debounce for better performance
        [doctors] // Use doctors from Redux store
    );

    const handleSearch = (text) => {
        setSearchQuery(text);
        performSearch(text);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <StatusBar backgroundColor="white" barStyle="dark-content" />
            <View style={styles.container}>
                <View style={styles.header}>
                    <Pressable onPress={() => navigation.goBack()} style={styles.backIcon}>
                        <ArrowLeft color="#000" size={24} />
                    </Pressable>
                    <View style={styles.Location}>
                        <MapPin color="#000" size={20} />
                        <Text style={styles.locationText}>IIT Kharagpur</Text>
                    </View>
                </View>

                <View style={styles.searchBarContainer}>
                    <View style={styles.searchBarTouchable}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search doctors, or specialties"
                            placeholderTextColor="#999"
                            value={searchQuery}
                            onChangeText={handleSearch}
                            autoFocus={shouldFocusInput}
                            clearButtonMode="while-editing"
                        />
                    </View>
                </View>

                {isLoading ? (
                    <View style={styles.listContainer}>
                        {Array.from({ length: 5 }).map((_, index) => (
                            <View key={index} style={styles.card}>
                                <ShimmerPlaceholder style={styles.profileImage} />
                                <View style={styles.cardContent}>
                                    <ShimmerPlaceholder style={styles.DoctorNameShimmer} />
                                    <View style={styles.content}>
                                        <ShimmerPlaceholder style={styles.DoctoraddressShimmer} />
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                ) : (
                    <FlatList
                        data={filteredResults}
                        keyExtractor={(item, index) => `${item.id}-${index}-${item.type}`}
                        contentContainerStyle={styles.listContainer}
                        renderItem={({ item }) => (
                            <SearchResultItem
                                item={item}
                                searchQuery={searchQuery}
                                navigation={navigation}
                            />
                        )}
                        ItemSeparatorComponent={ItemSeparator}
                        ListEmptyComponent={
                            searchQuery.length > 0 && (
                                <Text style={styles.noResultsText}>
                                    No results found for "{searchQuery}"
                                </Text>
                            )
                        }
                        keyboardShouldPersistTaps="handled"
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    DoctorNameShimmer: {
        marginTop:width * 0.015,
        width: width * 0.4,
        borderRadius: width * 0.1,
        height:width * 0.04,
    },
    DoctoraddressShimmer: {
        width: width * 0.7,
        borderRadius: width * 0.1,
        height:width * 0.04,
    },
    container: {
        flex: 1,
        backgroundColor: '#ffff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backIcon: {
        width: width * 0.1,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    Location: {
        marginLeft: width * 0.21,
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginLeft: 5,
    },
    searchBarContainer: {
        padding: 15,
        backgroundColor: '#fff',
    },
    searchBarTouchable: {},
    searchInput: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        fontSize: 16,
        paddingVertical: 10,
        paddingHorizontal: 15,
        color: '#333',
    },
    listContainer: {
        paddingHorizontal: 15,
        paddingBottom: 20,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        paddingTop:12,
        paddingBottom:12,
    },
    cardPressed: {
        backgroundColor: '#16477215',
        borderRadius: 8,
    },
    divider: {
        height: 0.7,
        backgroundColor: '#16477220',
    },
    profileImage: {
        width: 45,
        height: 45,
        borderRadius: 25,
        marginRight: 15,
        backgroundColor: '#f0f0f0',
    },
    cardContent: {
        flex: 1,
    },
    content:{
        flex:1,
        flexDirection:'row',
        alignItems:'center',
    },
    circle:{
        width: width * 0.015,
        height: width * 0.015,
        borderRadius: width,
        backgroundColor: '#00000050',
        marginRight: width * 0.01,
        marginLeft: width * 0.01,
    },
    itemName: {
        fontSize: 14,
        color: '#000',
        fontWeight:'500',
        marginBottom: 2,
    },
    highlight: {
        color: '#1BBA8D',
        fontWeight:'700',
    },
    specialization: {
        fontSize: 14,
        color: 'black',
    },
    address: {
        fontSize: 14,
        color: '#666',
    },
    noResultsText: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
        marginTop: 20,
    },
});

export default SearchScreen;
