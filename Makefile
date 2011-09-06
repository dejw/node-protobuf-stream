
test:
	@protoc test/test.proto -o test/test.desc
	@nodeunit test/test_*.js

clean:
	@rm -f test/test.desc

.PHONY: test