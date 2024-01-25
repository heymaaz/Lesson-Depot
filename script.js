const api_url = 'http://localhost:3000/';//URL for the api
//Creating the vue app
const app = Vue.createApp({
    data() {
        return {
            lessons: [],//Initialising the lessons
            lessonsCount: 0,//Initialising the count of lessons
            sitename: 'VueJS Lesson Depot',
            cart: [],//Array(11).fill(0),//Creating an array of size lessonsData.length+1 and filling it with 0
            showcart: false,//Boolean to show or hide the cart
            order: {
                full_name: '',//Initialising the full name
                phone_number: ''//Initialising the phone number
            },
            search_query: '',//Initialising the search query
            sort_by: '',//Initialising the sort_by
            sort_desc: false//Boolean for sort in ascending or descending order

        };
    },
    created() {
        //get count of lessons
        fetch(api_url + 'count/lessons')//Fetching the count of lessons
            .then(response => response.json())
            .then(data => {
                //console.log(data);
                this.lessonsCount = data;//Setting the count of lessons
            })
            .then(() => {
                //get lessons
                fetch(api_url + 'search/lessons/'+this.lessonsCount+'/id/asc?')//Fetching the lessons
                    .then(response => response.json())
                    .then(data => {
                        this.lessons = data;//Setting the lessons
                    });
            }
            )
            .then(() => {
                //initialise cart
                for(let i = 0; i <= this.lessonsCount; i++){
                    this.cart.push(0);//Pushing the lessons to the cart
                }
            })
            .catch(err => {
                console.log(err);
            });
    },
    methods: {
        addToCart(id) {
            this.cart[id]++;//Adding the lesson to cart
            /* This was used in Vue 2
                console.log(`Adding to cart: ID=${id}`);//Logging the id of the lesson added to cart
                this.$set(this.cart, id, this.cart[id] + 1);//Adding the lesson to cart
            */
        },
        setSortBy(sort_by) {
            this.sort_by = sort_by;//Setting the sort_by
        },
        removeFromCart(id) {
            this.cart[id]--;//Removing the lesson from cart
            /* This was used in Vue 2
                console.log(`Removing from cart: ID=${id}`);//Logging the id of the lesson removed from cart
                this.$set(this.cart, id, this.cart[id] - 1);//Removing the lesson from cart
            */
        },
        canAddToCart(id){
            if (!this.lessons || this.lessons.length === 0 || !this.cart || id < 1 || id > this.lessons.length) {
                return false; // Default value for handling invalid cases
            }
            return this.lessons[id-1].availableInventory > this.cart[id];//Checking if the stock is available
        },
        stockLevel(id) {
            if (!this.lessons || this.lessons.length === 0 || !this.cart || id < 1 || id > this.lessons.length) {
                return 0; // Default value for handling invalid cases
            }
            return this.lessons[id-1].availableInventory - this.cart[id];//Returning the stock level
        },
        clickCart() {
            this.search_query = '';//Clearing the search query when the cart is clicked to show all the lessons in the cart
            this.showcart = !this.showcart;//Showing or hiding the cart
        },
        place_order() {
            var sendOrder = {
                "customerDetails": {
                    "name": this.order.full_name,
                    "contactNumber": this.order.phone_number
                },
                "orderItems": [],
                "totalPrice": Number(this.cartTotal),
                "orderDate": new Date().toISOString().slice(0, 10)
            };
        
            // Process the cart items
            for (let i = 1; i < this.cart.length; i++) {
                if (this.cart[i] > 0) {
                    sendOrder.orderItems.push({
                        "lessonId": this.lessons[i-1]._id,
                        "title": this.lessons[i-1].title,
                        "price": this.lessons[i-1].price,
                        "quantity": this.cart[i]
                    });
                }
            }
        
            console.log(sendOrder);
            // Send the order to the server
            fetch(api_url + 'orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(sendOrder)
            })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                alert("Order placed!");//Alerting the user that the order has been placed
                //reload the page
                //location.reload();
            })
            .then(() => {//update the inventory of the lessons with the new stock level
                for(let i = 1; i < this.cart.length; i++){
                    if(this.cart[i] > 0){
                        fetch(api_url + 'collections/lessons/'+this.lessons[i-1]._id, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                "availableInventory": this.lessons[i-1].availableInventory - this.cart[i]
                            })
                        })
                        .then(response => response.json())
                        .then(data => {
                            console.log(data);
                        })
                        .catch(err => {
                            console.log(err);
                        });
                    }
                }
            })
            .catch(err => {
                console.log(err);
            });

            /*
            var sendOrder = {
                "customerDetails": {
                    "name": this.order.full_name,
                    "contactNumber": this.order.phone_number
                },
                "orderItems": {

                },
                "totalPrice": this.cartTotal,
                "orderDate": new Date().toISOString().slice(0, 10)
            }.then(() => {
                for(let i = 1; i < this.cart.length; i++){
                    if(this.cart[i] > 0){
                        sendOrder.orderItems.push(
                            {
                                "lessonId": this.lessons[i-1]._id,
                                "title": this.lessons[i-1].title,
                                "price": this.lessons[i-1].price,
                                "quantity": this.cart[i]
                            }
                        );
                    }
                }
            }).then(() => {
                console.log(sendOrder);
            });
            */
            
            
            /*Old code where just an alert was shown and the page was reloaded
                alert("Order placed!");//Alerting the user that the order has been placed
                //reload the page
                location.reload();
            */
        },
        getImage(path){
            return api_url +"images/"+ path;//Returning the image path
        },
        debounceSearch() {
            if (this.debounce) clearTimeout(this.debounce);
            this.debounce = setTimeout(() => {
                this.searchLessons();
            }, 300); // Adjust 300 to the desired debounce time in milliseconds
        },
        searchLessons() {
            fetch(api_url + 'search/lessons/'+this.lessonsCount+'/id/asc?searchTerm='+this.search_query)
                .then(response => response.json())
                .then(data => {
                    this.lessons = data;
                }).catch(err => {
                    console.log(err);
                });
        }
    },
    computed: {
        cartCount() {//Computing the cart count
            let sum = 0;
            for(let i = 0; i < this.cart.length; i++){
                sum += this.cart[i];
            }
            return sum||"";
        },
        cartTotal() {//Computing the cart total
            let sum = 0;
            for(let i = 1; i < this.cart.length; i++){
                sum += this.cart[i] * this.lessons[i-1].price;
            }
            return sum.toFixed(2)||"";
        },
        placeordercheck() {//Checking if the order can be placed
            if(this.order.full_name == '' || this.order.phone_number =='')
                return false;
            return RegExp(/^[a-zA-Z ]+$/).test(this.order.full_name)&&RegExp(/^[0-9]+$/).test(this.order.phone_number);
        },
        filteredLessons() {//Filtering the lessons
            return this.lessons;//Returning all the lessons as the search is done in the backend
            /*This was used for frontend filtering
                return this.lessons.filter(lesson => {
                    return lesson.title.toLowerCase().includes(this.search_query.toLowerCase())
                    || lesson.description.toLowerCase().includes(this.search_query.toLowerCase())
                    || lesson.location.toLowerCase().includes(this.search_query.toLowerCase())
                });
            */
        },
        sortMethod() {
            if(this.sort_desc)
                return "Descending";
            return "Ascending";
        },
        sortedLessons() {//Sorting the lessons
            if(this.sort_by == 'Title')
                if(this.sort_desc){
                    return this.filteredLessons.sort((b, a) => {
                        return a.title.localeCompare(b.title);
                    });
                }
                else{
                    return this.filteredLessons.sort((a, b) => {
                        return a.title.localeCompare(b.title);
                    });
                }
                
            else if(this.sort_by == 'Price')
                if(this.sort_desc){
                    return this.filteredLessons.sort((b, a) => {
                        return a.price - b.price;
                    });
                }
                else{
                    return this.filteredLessons.sort((a, b) => {
                        return a.price - b.price;
                    });
                }
            else if(this.sort_by == 'Location')
                if(this.sort_desc){
                    return this.filteredLessons.sort((b, a) => {
                        return a.location.localeCompare(b.location);
                    });
                }
                else{
                    return this.filteredLessons.sort((a, b) => {
                        return a.location.localeCompare(b.location);
                    });
                }
            else if(this.sort_by == 'Availability')
                if(this.sort_desc){
                    return this.filteredLessons.sort((b, a) => {
                        return this.stockLevel(a.id) - this.stockLevel(b.id);
                    });
                }
                else{
                    return this.filteredLessons.sort((a, b) => {
                        return this.stockLevel(a.id) - this.stockLevel(b.id);
                    });
                }
            else{
                return this.filteredLessons.sort((a, b) => {
                        return a.id - b.id;
            });
            }
                
        }
    },
    watch: {
        search_query: function(newQuery, oldQuery) {
            if (newQuery !== oldQuery) {
                this.debounceSearch();
            }
        }
        /*
        search_query: function(){
            fetch(api_url + 'search/lessons/'+this.lessonsCount+'/id/asc?searchTerm='+this.search_query)//Fetching the lessons
                .then(response => response.json())
                .then(data => {
                    this.lessons = data;//Setting the lessons
                }
            ).catch(err => {
                console.log(err);
            });
        }*/
    }
});
app.mount('#app');
/*
var app = new Vue({
    el: '#app',
    data: {
        lessons: [],
        sitename: 'VueJS Lesson Depot',
        cart: Array(11).fill(0),//Creating an array of size lessonsData.length+1 and filling it with 0
        showcart: false,//Boolean to show or hide the cart
        order: {
            full_name: '',//Initialising the full name
            phone_number: ''//Initialising the phone number
        },
        search_query: '',//Initialising the search query
        sort_by: '',//Initialising the sort_by
        sort_desc: false//Boolean for sort in ascending or descending order
    },
    methods: {
        addToCart(id) {
            console.log(`Adding to cart: ID=${id}`);//Logging the id of the lesson added to cart
            this.$set(this.cart, id, this.cart[id] + 1);//Adding the lesson to cart
        },
        setSortBy(sort_by) {
            this.sort_by = sort_by;//Setting the sort_by
        },
        removeFromCart(id) {
            console.log(`Removing from cart: ID=${id}`);//Logging the id of the lesson removed from cart
            this.$set(this.cart, id, this.cart[id] - 1);//Removing the lesson from cart
        },
        canAddToCart(id){
            return this.lessons[id-1].availableInventory > this.cart[id];//Checking if the stock is available
        },
        stockLevel(id) {
            return this.lessons[id-1].availableInventory - this.cart[id];//Returning the stock level
        },
        clickCart() {
            this.showcart = !this.showcart;//Showing or hiding the cart
        },
        place_order() {
            alert("Order placed!");//Alerting the user that the order has been placed
            //reload the page
            location.reload();
        }
    },
    computed: {
        cartCount() {//Computing the cart count
            let sum = 0;
            for(let i = 0; i < this.cart.length; i++){
                sum += this.cart[i];
            }
            return sum||"";
        },
        cartTotal() {//Computing the cart total
            let sum = 0;
            for(let i = 1; i < this.cart.length; i++){
                sum += this.cart[i] * this.lessons[i-1].price;
            }
            return sum.toFixed(2)||"";
        },
        placeordercheck() {//Checking if the order can be placed
            if(this.order.full_name == '' || this.order.phone_number =='')
                return false;
            return RegExp(/^[a-zA-Z ]+$/).test(this.order.full_name)&&RegExp(/^[0-9]+$/).test(this.order.phone_number);
        },
        filteredLessons() {//Filtering the lessons
            return this.lessons.filter(lesson => {
                return lesson.title.toLowerCase().includes(this.search_query.toLowerCase())
                || lesson.description.toLowerCase().includes(this.search_query.toLowerCase())
                || lesson.location.toLowerCase().includes(this.search_query.toLowerCase())
            });
        },
        sortMethod() {
            if(this.sort_desc)
                return "Descending";
            return "Ascending";
        },
        sortedLessons() {//Sorting the lessons
            if(this.sort_by == 'Title')
                if(this.sort_desc){
                    return this.filteredLessons.sort((b, a) => {
                        return a.title.localeCompare(b.title);
                    });
                }
                else{
                    return this.filteredLessons.sort((a, b) => {
                        return a.title.localeCompare(b.title);
                    });
                }
                
            else if(this.sort_by == 'Price')
                if(this.sort_desc){
                    return this.filteredLessons.sort((b, a) => {
                        return a.price - b.price;
                    });
                }
                else{
                    return this.filteredLessons.sort((a, b) => {
                        return a.price - b.price;
                    });
                }
            else if(this.sort_by == 'Location')
                if(this.sort_desc){
                    return this.filteredLessons.sort((b, a) => {
                        return a.location.localeCompare(b.location);
                    });
                }
                else{
                    return this.filteredLessons.sort((a, b) => {
                        return a.location.localeCompare(b.location);
                    });
                }
            else if(this.sort_by == 'Availability')
                if(this.sort_desc){
                    return this.filteredLessons.sort((b, a) => {
                        return this.stockLevel(a.id) - this.stockLevel(b.id);
                    });
                }
                else{
                    return this.filteredLessons.sort((a, b) => {
                        return this.stockLevel(a.id) - this.stockLevel(b.id);
                    });
                }
            else{
                return this.filteredLessons.sort((a, b) => {
                        return a.id - b.id;
            });
            }
                
        }
    }
});
*/